# tts

- 路径: `kilocode/src/utils/tts.ts`
- 概述: 文本转语音（Text-to-Speech）工具，支持开启/关闭、语速设置、播放与停止。

## 导出 API
- `setTtsEnabled(enabled: boolean): void`
- `setTtsSpeed(newSpeed: number): void`
- `playTts(message: string, options?: PlayTtsOptions): Promise<void>`
- `stopTts(): void`

## 使用示例
```ts
import { setTtsEnabled, setTtsSpeed, playTts } from "kilocode/src/utils/tts";

setTtsEnabled(true);
setTtsSpeed(1.2);
await playTts("任务已完成");
```

## 注意事项
- 播放依赖宿主环境的音频能力；在无音频设备或权限受限时可能失败。
- 注意与 UI/状态交互，避免在用户不期望时自动播放。