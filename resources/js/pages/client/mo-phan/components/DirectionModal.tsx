import { useEffect, useRef, useState } from 'react';
import maplibregl from '@openmapvn/openmapvn-gl';
import '@openmapvn/openmapvn-gl/dist/maplibre-gl.css';
import Icon from '../../../../components/gia-pha/Icon';
import { OpenMapDirectionSummary, OpenMapVehicle, khuMoApi } from '../../../../services/gia-pha.api';

interface DirectionModalProps {
    target: { title: string; lat: number; lng: number };
    onClose: () => void;
}

const DIRECTION_VEHICLES: Array<{ value: OpenMapVehicle; label: string }> = [
    { value: 'motor', label: '🛵 Xe máy' },
    { value: 'car', label: '🚗 Ô tô' },
    { value: 'walking', label: '🚶 Đi bộ' },
    { value: 'bike', label: '🚲 Xe đạp' },
];

function mapUrl(viDo: number | string, kinhDo: number | string): string {
    return `https://www.google.com/maps?q=${viDo},${kinhDo}`;
}

function openMapPlaceUrl(viDo: number | string, kinhDo: number | string): string {
    return `https://www.openmap.vn/place/latlon%3A${viDo}%3A${kinhDo}`;
}

/** Giải mã Google Encoded Polyline → mảng [lat, lng] */
function decodePolyline(encoded: string): [number, number][] {
    const coords: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;
    while (index < encoded.length) {
        let b: number;
        let shift = 0;
        let result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lat += result & 1 ? ~(result >> 1) : result >> 1;
        shift = 0; result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lng += result & 1 ? ~(result >> 1) : result >> 1;
        coords.push([lat / 1e5, lng / 1e5]);
    }
    return coords;
}

function getErrorMessage(error: unknown, fallback: string): string {
    const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
    if (data?.message) return data.message;

    const firstError = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
    return firstError || fallback;
}

export default function DirectionModal({ target, onClose }: DirectionModalProps) {
    const [loading, setLoading] = useState(false);
    const [vehicle, setVehicle] = useState<OpenMapVehicle>('motor');
    const [summary, setSummary] = useState<OpenMapDirectionSummary | null>(null);
    const [error, setError] = useState('');
    const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
    const [mapReady, setMapReady] = useState(false);
    const [provider, setProvider] = useState<'openmap' | 'osrm' | null>(null);

    // Tính năng mới
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDriving, setIsDriving] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<any>(null);
    const userMarkerRef = useRef<any>(null);
    const carMarkerRef = useRef<any>(null);
    const currentCarPosRef = useRef<[number, number] | null>(null);
    const stepMarkersRef = useRef<any[]>([]);
    const animationRef = useRef<number | null>(null);

    const recenterToCar = () => {
        if (leafletMapRef.current && currentCarPosRef.current) {
            leafletMapRef.current.easeTo({
                center   : currentCarPosRef.current,
                zoom     : 17,
                pitch    : 45,
                duration : 600,
            });
        }
    };

    const VEHICLE_ICONS: Record<OpenMapVehicle, string> = {
        motor   : '🛵',
        car     : '🚗',
        walking : '🚶',
        bike    : '🚲',
        taxi    : '🚕',
        truck   : '🚚',
    };

    // Hàm tính góc xoay (bearing) giữa 2 tọa độ
    const calculateBearing = (startLat: number, startLng: number, endLat: number, endLng: number): number => {
        const dLng = (endLng - startLng) * Math.PI / 180;
        const sLat = startLat * Math.PI / 180;
        const eLat = endLat * Math.PI / 180;
        const y = Math.sin(dLng) * Math.cos(eLat);
        const x = Math.cos(sLat) * Math.sin(eLat) - Math.sin(sLat) * Math.cos(eLat) * Math.cos(dLng);
        return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    };

    // Cleanup animation và markers khi unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (carMarkerRef.current) carMarkerRef.current.remove();
            if (stepMarkersRef.current) {
                stepMarkersRef.current.forEach((marker) => marker.remove());
            }
        };
    }, []);

    // ─── Khởi tạo OpenMapVN GL map ──────────────────────────────────────────────────────
    useEffect(() => {
        let map: any = null;
        const init = async () => {
            if (!mapContainerRef.current || leafletMapRef.current) return;

            map = new maplibregl.Map({
                container : mapContainerRef.current,
                style     : 'https://tiles.openmap.vn/styles/day-v1/style.json?apikey=PpZ3MzNjBzNKoHldACdR8pXK9ZV9bqz0',
                center    : [target.lng, target.lat],
                zoom      : 14,
            });

            map.addControl(new maplibregl.NavigationControl(), 'top-right');

            // Marker điểm đến (cờ đỏ)
            const el = document.createElement('div');
            el.innerHTML = `<div style="width:28px;height:28px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);background:linear-gradient(135deg,#c0392b,#e74c3c);box-shadow:0 4px 14px rgba(192,57,43,0.45);border:2.5px solid white;display:grid;place-items:center;cursor:pointer;">
                <span style="transform:rotate(45deg);font-size:13px;color:white;">&#x26B0;</span>
            </div>`;

            const popup = new maplibregl.Popup({ offset: 25 })
                .setHTML(`<strong style="font-size:13px">${target.title}</strong><br><span style="font-size:11px;color:#666">${target.lat.toFixed(6)}, ${target.lng.toFixed(6)}</span>`);

            new maplibregl.Marker({ element: el })
                .setLngLat([target.lng, target.lat])
                .setPopup(popup)
                .addTo(map);

            leafletMapRef.current = map;
            setMapReady(true);
            setTimeout(() => {
                map.resize();
            }, 100);
        };

        init();
        return () => {
            if (map) { map.remove(); leafletMapRef.current = null; }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Resize map khi sẵn sàng hoặc khi đổi chế độ fullscreen ───────────────────────
    useEffect(() => {
        if (mapReady && leafletMapRef.current) {
            setTimeout(() => {
                leafletMapRef.current.resize();
            }, 150);
        }
    }, [mapReady, isFullscreen]);

    // ─── Vẽ tuyến đường khi có kết quả ───────────────────────────────────────
    useEffect(() => {
        if (!summary || !leafletMapRef.current || !userPos) return;

        const drawRoute = () => {
            const map = leafletMapRef.current;
            if (!map) return;

            // Xóa các marker & route cũ nếu có
            if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null; }
            if (carMarkerRef.current) { carMarkerRef.current.remove(); carMarkerRef.current = null; }
            if (animationRef.current) { cancelAnimationFrame(animationRef.current); animationRef.current = null; }
            if (stepMarkersRef.current) {
                stepMarkersRef.current.forEach((marker) => marker.remove());
                stepMarkersRef.current = [];
            }
            setIsDriving(false);
            setCurrentStepIndex(-1);

            if (map.getLayer('route-line')) map.removeLayer('route-line');
            if (map.getLayer('route-shadow')) map.removeLayer('route-shadow');
            if (map.getSource('route')) map.removeSource('route');

            // Marker vị trí user (chấm xanh dương)
            const el = document.createElement('div');
            el.style.position = 'relative';
            el.style.width = '24px';
            el.style.height = '24px';
            el.innerHTML = `
                <div style="position:absolute;inset:0;border-radius:50%;background:rgba(41,128,185,0.25);animation:pulse-map 2s infinite;"></div>
                <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:#2980b9;border:2.5px solid white;box-shadow:0 2px 8px rgba(41,128,185,0.6);"></div>
            `;

            const popup = new maplibregl.Popup({ offset: 12 })
                .setHTML('<strong style="font-size:12px">Vị trí của bạn</strong>');

            userMarkerRef.current = new maplibregl.Marker({ element: el })
                .setLngLat([userPos.lng, userPos.lat])
                .setPopup(popup)
                .addTo(map);

            // Vẽ tuyến đường
            if (summary.overviewPolyline) {
                const coords = decodePolyline(summary.overviewPolyline);
                if (coords.length > 0) {
                    const geojsonCoords = coords.map(([lat, lng]) => [lng, lat]);

                    map.addSource('route', {
                        type : 'geojson',
                        data : {
                            type       : 'Feature',
                            properties : {},
                            geometry   : {
                                type        : 'LineString',
                                coordinates : geojsonCoords,
                            },
                        },
                    });

                    // Vẽ bóng mờ
                    map.addLayer({
                        id     : 'route-shadow',
                        type   : 'line',
                        source : 'route',
                        layout : {
                            'line-join' : 'round',
                            'line-cap'  : 'round',
                        },
                        paint : {
                            'line-color' : 'rgba(41,128,185,0.18)',
                            'line-width' : 14,
                        },
                    });

                    // Vẽ đường chính
                    map.addLayer({
                        id     : 'route-line',
                        type   : 'line',
                        source : 'route',
                        layout : {
                            'line-join' : 'round',
                            'line-cap'  : 'round',
                        },
                        paint : {
                            'line-color' : '#2980b9',
                            'line-width' : 5,
                        },
                    });

                    // Fit bounds tuyến đường
                    const bounds = geojsonCoords.reduce(
                        (b, coord) => b.extend(coord),
                        new maplibregl.LngLatBounds(geojsonCoords[0], geojsonCoords[0])
                    );
                    map.fitBounds(bounds, { padding: 50, maxZoom: 15 });

                    // Vẽ marker cho từng step hướng dẫn trên bản đồ
                    if (summary.steps && summary.steps.length > 0) {
                        summary.steps.forEach((step, index) => {
                            if (!step.location) return;
                            const stepEl = document.createElement('div');
                            stepEl.style.width = '20px';
                            stepEl.style.height = '20px';
                            stepEl.style.borderRadius = '50%';
                            stepEl.style.background = '#f39c12';
                            stepEl.style.border = '2px solid white';
                            stepEl.style.color = 'white';
                            stepEl.style.fontSize = '10px';
                            stepEl.style.fontWeight = 'bold';
                            stepEl.style.display = 'grid';
                            stepEl.style.placeItems = 'center';
                            stepEl.style.cursor = 'pointer';
                            stepEl.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
                            stepEl.innerHTML = String(index + 1);

                            const popup = new maplibregl.Popup({ offset: 10 })
                                .setHTML(`<strong style="font-size:12px;color:#c0392b;">Bước ${index + 1}</strong><br><span style="font-size:11.5px;color:#2c3e50;font-weight:700;line-height:1.4;">${step.instruction}</span><br><span style="font-size:10.5px;color:#7f8c8d;margin-top:4px;display:block;">Quãng đường: ${step.distanceText} · Thời gian: ${step.durationText}</span>`);

                            const marker = new maplibregl.Marker({ element: stepEl })
                                .setLngLat(step.location)
                                .setPopup(popup)
                                .addTo(map);

                            stepMarkersRef.current.push(marker);
                        });
                    }
                }
            }
        };

        drawRoute();
    }, [summary, userPos]);

    // ─── Logic mô phỏng lái xe (Simulation Drive) ──────────────────────────
    const startDriving = () => {
        if (!summary || !leafletMapRef.current || !userPos) return;
        const map = leafletMapRef.current;
        const coords = decodePolyline(summary.overviewPolyline);
        if (coords.length === 0) return;

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        setIsDriving(true);
        setCurrentStepIndex(0);

        // Ẩn marker user tĩnh
        if (userMarkerRef.current) {
            userMarkerRef.current.remove();
            userMarkerRef.current = null;
        }

        // Khởi tạo car marker
        if (carMarkerRef.current) {
            carMarkerRef.current.remove();
        }

        const carEl = document.createElement('div');
        carEl.style.width = '40px';
        carEl.style.height = '40px';
        carEl.style.display = 'grid';
        carEl.style.placeItems = 'center';
        carEl.style.transition = 'transform 0.1s linear';
        
        // Mũi tên xanh phát sáng 3D dẫn đường chuyên nghiệp
        carEl.innerHTML = `
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="16" fill="rgba(41, 128, 185, 0.25)" />
                <circle cx="20" cy="20" r="12" fill="#2980b9" stroke="white" stroke-width="2.5" style="filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.3));" />
                <path d="M20 11L25.5 24.5L20 22L14.5 24.5L20 11Z" fill="white" />
            </svg>
        `;

        carMarkerRef.current = new maplibregl.Marker({ element: carEl })
            .setLngLat([coords[0][1], coords[0][0]])
            .addTo(map);

        let currentIndex = 0;
        const totalPoints = coords.length;

        const animate = () => {
            if (currentIndex >= totalPoints - 1) {
                setIsDriving(false);
                setCurrentStepIndex(-1);
                // Hoàn tất hành trình, vẽ lại user marker
                stopDriving();
                return;
            }

            const currentPoint = coords[currentIndex];
            const nextPoint = coords[currentIndex + 1];
            const bearing = calculateBearing(currentPoint[0], currentPoint[1], nextPoint[0], nextPoint[1]);

            currentCarPosRef.current = [nextPoint[1], nextPoint[0]];

            if (carMarkerRef.current) {
                carMarkerRef.current.setLngLat([nextPoint[1], nextPoint[0]]);
                carEl.style.transform = `rotate(${bearing}deg)`;
            }

            // Tự động zoom và track theo xe đang di chuyển
            map.easeTo({
                center   : [nextPoint[1], nextPoint[0]],
                zoom     : 17,
                pitch    : 45,
                bearing  : bearing,
                duration : 220,
            });

            // Đồng bộ bước đi trong Hướng dẫn từng bước
            const percent = currentIndex / totalPoints;
            if (summary.steps && summary.steps.length > 0) {
                const stepIdx = Math.min(Math.floor(percent * summary.steps.length), summary.steps.length - 1);
                setCurrentStepIndex(stepIdx);
            }

            currentIndex++;
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    const stopDriving = () => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        setIsDriving(false);
        setCurrentStepIndex(-1);
        currentCarPosRef.current = null;

        if (carMarkerRef.current) {
            carMarkerRef.current.remove();
            carMarkerRef.current = null;
        }

        const map = leafletMapRef.current;
        if (map && userPos) {
            // Reset góc nhìn bản đồ
            map.easeTo({
                pitch    : 0,
                bearing  : 0,
                zoom     : 14,
                center   : [target.lng, target.lat],
                duration : 800,
            });

            // Vẽ lại user marker bình thường
            if (!userMarkerRef.current) {
                const el = document.createElement('div');
                el.style.position = 'relative';
                el.style.width = '24px';
                el.style.height = '24px';
                el.innerHTML = `
                    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(41,128,185,0.25);animation:pulse-map 2s infinite;"></div>
                    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:#2980b9;border:2.5px solid white;box-shadow:0 2px 8px rgba(41,128,185,0.6);"></div>
                `;

                userMarkerRef.current = new maplibregl.Marker({ element: el })
                    .setLngLat([userPos.lng, userPos.lat])
                    .addTo(map);
            }
        }
    };

    // ─── Lấy chỉ đường ────────────────────────────────────────────────────────
    const getDirection = () => {
        if (!navigator.geolocation) { setError('Thiết bị không hỗ trợ GPS.'); return; }
        setLoading(true);
        setError('');
        setSummary(null);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
                setUserPos(pos);
                try {
                    const res = await khuMoApi.direction({
                        origin       : `${pos.lat},${pos.lng}`,
                        destination  : `${target.lat},${target.lng}`,
                        vehicle,
                        alternatives : false,
                        admin_v2     : true,
                    });
                    if (res.success && res.data) {
                        setSummary(res.data);
                        setProvider((res as any).provider ?? null);
                    } else {
                        setError(res.message || 'Không thể lấy chỉ đường.');
                    }
                } catch (err) {
                    setError(getErrorMessage(err, 'Không thể lấy chỉ đường.'));
                } finally {
                    setLoading(false);
                }
            },
            () => { setError('Không thể lấy vị trí hiện tại. Vui lòng cấp quyền GPS.'); setLoading(false); },
            { enableHighAccuracy: true, timeout: 12000 },
        );
    };

    const resetVehicle = (v: OpenMapVehicle) => {
        setVehicle(v);
        setSummary(null);
        setError('');
        setUserPos(null);
        setIsDriving(false);
        setCurrentStepIndex(-1);

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        const map = leafletMapRef.current;
        if (!map) return;

        if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null; }
        if (carMarkerRef.current) { carMarkerRef.current.remove(); carMarkerRef.current = null; }
        if (map.getLayer('route-line')) map.removeLayer('route-line');
        if (map.getLayer('route-shadow')) map.removeLayer('route-shadow');
        if (map.getSource('route')) map.removeSource('route');

        map.setView([target.lng, target.lat], 14);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', padding: isFullscreen ? '0' : '16px' }}>
            <style>{`@keyframes pulse-map{0%,100%{transform:scale(1);opacity:0.6}50%{transform:scale(1.8);opacity:0}}`}</style>

            <div style={{
                width         : '100%',
                maxWidth      : isFullscreen ? '100vw' : '580px',
                height        : isFullscreen ? '100vh' : 'auto',
                background    : 'var(--bg-elev)',
                borderRadius  : isFullscreen ? 0 : 20,
                border        : isFullscreen ? 'none' : '1px solid var(--line)',
                boxShadow     : isFullscreen ? 'none' : '0 28px 70px rgba(0,0,0,0.35)',
                overflow      : 'hidden',
                display       : 'flex',
                flexDirection : 'column',
                maxHeight     : isFullscreen ? '100vh' : '92vh',
                transition    : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>

                {/* ─ Header ─────────────────────────────────────────── */}
                <div style={{
                    padding        : '16px 20px',
                    display        : 'flex',
                    justifyContent : 'space-between',
                    gap            : 12,
                    alignItems     : 'center',
                    background     : 'linear-gradient(135deg, var(--gold), var(--brown-soft))',
                    color          : 'white',
                    flexShrink     : 0,
                }}>
                    <div>
                        <div style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700, opacity: 0.82, textTransform: 'uppercase' }}>
                            Chỉ đường • OpenMap.vn {isFullscreen && '• TOÀN MÀN HÌNH'}
                        </div>
                        <h2 style={{ margin: '2px 0 0', fontSize: 17, fontWeight: 800, lineHeight: 1.3 }}>{target.title}</h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                            type="button"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            title={isFullscreen ? 'Thu nhỏ' : 'Phóng to toàn màn hình'}
                            style={{
                                width        : 34,
                                height       : 34,
                                borderRadius : 999,
                                border       : 'none',
                                background   : 'rgba(255,255,255,0.2)',
                                color        : 'white',
                                cursor       : 'pointer',
                                display      : 'grid',
                                placeItems   : 'center',
                            }}
                        >
                            <Icon name={isFullscreen ? 'minimize' : 'maximize'} size={15} />
                        </button>
                        <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            <Icon name="x" size={15} />
                        </button>
                    </div>
                </div>

                {/* ─ Vehicle selector ──────────────────────────────── */}
                <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--line-soft)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, flexShrink: 0 }}>
                    {DIRECTION_VEHICLES.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => resetVehicle(item.value)}
                            className={vehicle === item.value ? 'gp-btn gp-btn-primary' : 'gp-btn gp-btn-ghost'}
                            style={{ justifyContent: 'center', minWidth: 0, paddingInline: 6, fontSize: 12.5 }}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* ─ Bản đồ OpenMap.vn ─────────────────────────────────── */}
                <div style={{ position: 'relative', height: isFullscreen ? '50vh' : 310, flexShrink: 0, background: '#e8e0d5', transition: 'height 0.3s' }}>
                    <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0, zIndex: 10 }} />
                    
                    {/* Nút phóng to nổi trên góc bản đồ để tiện click */}
                    <button
                        type="button"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        style={{
                            position     : 'absolute',
                            bottom       : 16,
                            left         : 16,
                            zIndex       : 15,
                            background   : 'var(--bg-elev)',
                            border       : '1px solid var(--line)',
                            borderRadius : 10,
                            padding      : '8px 12px',
                            color        : 'var(--ink)',
                            fontWeight   : 700,
                            fontSize     : 12,
                            display      : 'flex',
                            alignItems   : 'center',
                            gap          : 6,
                            cursor       : 'pointer',
                            boxShadow    : 'var(--shadow-md)',
                        }}
                    >
                        <Icon name={isFullscreen ? 'minimize' : 'maximize'} size={13} />
                        {isFullscreen ? 'Thu nhỏ' : 'Phóng to để đi'}
                    </button>

                    {/* Nút định vị về vị trí xe */}
                    {isDriving && (
                        <button
                            type="button"
                            onClick={recenterToCar}
                            style={{
                                position     : 'absolute',
                                bottom       : 16,
                                right        : 16,
                                zIndex       : 15,
                                background   : 'var(--bg-elev)',
                                border       : '1px solid var(--line)',
                                borderRadius : 10,
                                padding      : '8px 12px',
                                color        : 'var(--ink)',
                                fontWeight   : 700,
                                fontSize     : 12,
                                display      : 'flex',
                                alignItems   : 'center',
                                gap          : 6,
                                cursor       : 'pointer',
                                boxShadow    : 'var(--shadow-md)',
                            }}
                        >
                            <Icon name="crosshair" size={13} />
                            Vị trí xe
                        </button>
                    )}

                    {!mapReady && (
                        <div style={{
                            position       : 'absolute',
                            inset          : 0,
                            display        : 'flex',
                            alignItems     : 'center',
                            justifyContent : 'center',
                            background     : 'var(--card-soft)',
                            zIndex         : 20,
                            gap            : 8,
                            color          : 'var(--ink-mute)',
                            fontSize       : 13,
                        }}>
                            <Icon name="map" size={16} />
                            Đang tải bản đồ...
                        </div>
                    )}
                </div>

                {/* ─ Info panel (scrollable) ────────────────────────── */}
                <div style={{ padding: '14px 16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>

                    {/* Tóm tắt khoảng cách & thời gian */}
                    {summary && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div style={{ background: 'var(--card-soft)', border: '1px solid var(--line)', borderRadius: 12, padding: '12px 14px' }}>
                                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>{summary.distanceText}</div>
                                <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 4 }}>Quãng đường</div>
                            </div>
                            <div style={{ background: 'var(--card-soft)', border: '1px solid var(--line)', borderRadius: 12, padding: '12px 14px' }}>
                                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>{summary.durationText}</div>
                                <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 4 }}>Thời gian di chuyển</div>
                            </div>
                        </div>
                    )}

                    {/* Điều khiển Mô phỏng xe di chuyển */}
                    {summary && (
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            {!isDriving ? (
                                <button
                                    type="button"
                                    onClick={startDriving}
                                    className="gp-btn gp-btn-primary"
                                    style={{ flex: 1, justifyContent: 'center', background: 'var(--jade)', borderColor: 'var(--jade)' }}
                                >
                                    <Icon name="play" size={14} />
                                    Bắt đầu đi (Mô phỏng)
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={stopDriving}
                                    className="gp-btn gp-btn-primary"
                                    style={{ flex: 1, justifyContent: 'center', background: 'var(--crimson)', borderColor: 'var(--crimson)' }}
                                >
                                    <Icon name="x" size={14} />
                                    Dừng mô phỏng
                                </button>
                            )}
                        </div>
                    )}

                    {/* Provider badge */}
                    {provider && summary && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--ink-mute)' }}>
                            <span style={{
                                display      : 'inline-flex',
                                alignItems   : 'center',
                                gap          : 4,
                                borderRadius : 999,
                                padding      : '3px 8px',
                                fontSize     : 11,
                                fontWeight   : 700,
                                background   : provider === 'openmap' ? 'color-mix(in srgb, var(--jade) 12%, transparent)' : 'color-mix(in srgb, var(--gold) 12%, transparent)',
                                color        : provider === 'openmap' ? 'var(--jade)' : 'var(--brown)',
                                border       : `1px solid ${provider === 'openmap' ? 'color-mix(in srgb, var(--jade) 30%, transparent)' : 'color-mix(in srgb, var(--gold) 30%, transparent)'}`,
                            }}>
                                {provider === 'openmap' ? '✔ OpenMap.vn' : '⚒ OSRM Fallback'}
                            </span>
                        </div>
                    )}

                    {/* Hướng dẫn từng bước */}
                    {summary && summary.steps.length > 0 && (
                        <div style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-elev)' }}>
                            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line-soft)', fontSize: 11.5, fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: 1 }}>
                                Hướng dẫn từng bước
                            </div>
                            <div style={{ maxHeight: isFullscreen ? 320 : 220, overflowY: 'auto' }}>
                                {summary.steps.map((step, index) => {
                                    const isCurrent = index === currentStepIndex;
                                    const isNext = index === currentStepIndex + 1;
                                    const isPassed = currentStepIndex !== -1 && index < currentStepIndex;

                                    let stepBg = 'transparent';
                                    let stepBorder = '1px solid var(--line-soft)';
                                    let stepOpacity = 1;
                                    let stepColor = 'var(--ink)';

                                    if (isCurrent) {
                                        stepBg = 'color-mix(in srgb, var(--gold) 15%, transparent)';
                                        stepBorder = '1px solid var(--gold)';
                                        stepColor = 'var(--brown)';
                                    } else if (isNext) {
                                        stepBg = 'color-mix(in srgb, #2980b9 8%, transparent)';
                                        stepBorder = '1px solid #2980b9';
                                    } else if (isPassed) {
                                        stepOpacity = 0.45;
                                    }

                                    return (
                                        <div
                                            key={`${step.instruction}-${index}`}
                                            style={{
                                                display        : 'grid',
                                                gridTemplateColumns : '28px 1fr',
                                                gap            : 10,
                                                padding        : '10px 14px',
                                                borderBottom   : stepBorder,
                                                background     : stepBg,
                                                opacity        : stepOpacity,
                                                color          : stepColor,
                                                alignItems     : 'flex-start',
                                                transition     : 'all 0.3s ease',
                                            }}
                                        >
                                            <div style={{
                                                width        : 28,
                                                height       : 28,
                                                borderRadius : 999,
                                                background   : isCurrent ? 'var(--gold)' : isNext ? '#2980b9' : 'var(--gold-glow)',
                                                color        : isCurrent || isNext ? 'white' : 'var(--brown)',
                                                border       : '1px solid var(--gold-pale)',
                                                display      : 'grid',
                                                placeItems   : 'center',
                                                fontWeight   : 800,
                                                fontSize     : 11,
                                                flexShrink   : 0,
                                            }}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>
                                                    {step.instruction}
                                                    {isCurrent && <span style={{ marginLeft: 8, fontSize: 11, background: 'var(--gold)', color: 'white', padding: '2px 6px', borderRadius: 4 }}>Hiện tại</span>}
                                                    {isNext && <span style={{ marginLeft: 8, fontSize: 11, background: '#2980b9', color: 'white', padding: '2px 6px', borderRadius: 4 }}>Tiếp theo</span>}
                                                </div>
                                                <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 3 }}>{step.distanceText} · {step.durationText}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Trạng thái chờ */}
                    {!summary && !error && !loading && (
                        <div style={{ color: 'var(--ink-mute)', fontSize: 13, textAlign: 'center', padding: '6px 0', lineHeight: 1.6 }}>
                            Nhấn <strong>“Chỉ đường”</strong> để lấy GPS và vẽ tuyến đường lên bản đồ
                        </div>
                    )}
                    {loading && (
                        <div style={{ color: 'var(--ink-mute)', fontSize: 13, textAlign: 'center', padding: '6px 0' }}>
                            ⏳ Đang tính toán tuyến đường...
                        </div>
                    )}

                    {/* Lỗi */}
                    {error && (
                        <div style={{ color: 'var(--crimson)', fontSize: 13, borderRadius: 10, background: 'color-mix(in srgb, var(--crimson) 9%, transparent)', border: '1px solid color-mix(in srgb, var(--crimson) 25%, transparent)', padding: '10px 12px', lineHeight: 1.5 }}>
                            {error}
                        </div>
                    )}
                </div>

                {/* ─ Footer ────────────────────────────────────────────── */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--line-soft)', display: 'flex', gap: 8, justifyContent: 'flex-end', background: 'var(--bg-elev)', flexShrink: 0, flexWrap: 'wrap' }}>
                    <a href={openMapPlaceUrl(target.lat, target.lng)} target="_blank" rel="noreferrer" className="gp-btn gp-btn-ghost" style={{ textDecoration: 'none', fontSize: 12.5 }}>
                        <Icon name="map" size={14} />
                        OpenMap
                    </a>
                    <a href={mapUrl(target.lat, target.lng)} target="_blank" rel="noreferrer" className="gp-btn gp-btn-ghost" style={{ textDecoration: 'none', fontSize: 12.5 }}>
                        <Icon name="map" size={14} />
                        Google Maps
                    </a>
                    <button type="button" onClick={getDirection} disabled={loading} className="gp-btn gp-btn-primary" style={{ fontSize: 12.5, opacity: loading ? 0.7 : 1 }}>
                        <Icon name="crosshair" size={14} />
                        {loading ? 'Đang tính...' : 'Chỉ đường'}
                    </button>
                </div>
            </div>
        </div>
    );
}
