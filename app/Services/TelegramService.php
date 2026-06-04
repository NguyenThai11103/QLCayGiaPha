<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    private string $botToken;
    private string $baseUrl;

    public function __construct()
    {
        $this->botToken = config('services.telegram.bot_token', '');
        $this->baseUrl  = "https://api.telegram.org/bot{$this->botToken}";
    }

    /**
     * Gửi tin nhắn tới một chat_id
     */
    public function sendMessage(string $chatId, string $text): bool
    {
        if (empty($this->botToken) || empty($chatId)) {
            return false;
        }

        try {
            $response = Http::timeout(5)->post("{$this->baseUrl}/sendMessage", [
                'chat_id'    => $chatId,
                'text'       => $text,
                'parse_mode' => 'HTML',
            ]);

            if (!$response->successful()) {
                Log::warning('Telegram sendMessage failed', [
                    'chat_id'  => $chatId,
                    'response' => $response->json(),
                ]);
                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::error('Telegram sendMessage exception', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Gửi tin nhắn cho nhiều người
     */
    public function sendToMany(array $chatIds, string $text): void
    {
        foreach ($chatIds as $chatId) {
            if (!empty($chatId)) {
                $this->sendMessage($chatId, $text);
            }
        }
    }

    /**
     * Xác thực initData từ Telegram Mini App (HMAC-SHA256)
     * Trả về mảng dữ liệu nếu hợp lệ, null nếu bị giả mạo hoặc hết hạn
     */
    public function verifyInitData(string $initData): ?array
    {
        $params = [];
        parse_str($initData, $params);

        $hash = $params['hash'] ?? '';
        if (empty($hash)) {
            return null;
        }

        unset($params['hash']);
        ksort($params);

        $dataCheckString = implode("\n", array_map(
            fn($k, $v) => "{$k}={$v}",
            array_keys($params),
            array_values($params)
        ));

        $secretKey    = hash_hmac('sha256', $this->botToken, 'WebAppData', true);
        $expectedHash = hash_hmac('sha256', $dataCheckString, $secretKey);

        if (!hash_equals($expectedHash, $hash)) {
            return null;
        }

        // initData có hạn 24h
        if (time() - (int) ($params['auth_date'] ?? 0) > 86400) {
            return null;
        }

        if (isset($params['user'])) {
            $params['user'] = json_decode($params['user'], true);
        }

        return $params;
    }
}
