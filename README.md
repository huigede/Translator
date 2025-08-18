# Translator 快速翻译（Chrome MV3 扩展）

<p align="center">
  <img src="icon.png" alt="Translator Extension Icon" width="128" />
</p>


一个基于 Chrome 138+ 新增的本地 Translator API 和 Language Detector API 的轻量级翻译扩展，支持自动检测网页语言、自动翻译网页、离线翻译（首次可能需下载模型）、快速出结果。

## 特性
- 自动检测来源语言（LanguageDetector）
- 目标语言可选（默认中文）
- 使用浏览器内置 Translator API 本地翻译，隐私安全
- 首次使用自动下载模型，后续离线可用，响应更快
- 一键复制翻译结果
- 朗读翻译结果
- 支持自动/手动翻译当前网页
- 一比一还原Google原生网页翻译
- ✨ **选中文本自动翻译**：选中任意文本即可自动翻译（v1.2.0新增）

## 运行要求
- Chrome 版本：138+（支持 Translator 与 LanguageDetector）

## 安装与加载（开发者模式）
1. 打开 Chrome 地址栏：chrome://extensions
2. 打开右上角“开发者模式”开关
3. 点击“加载已解压的扩展程序”，选择本项目文件夹
4. 点击工具栏扩展图标，打开弹窗使用

## 使用说明

### 弹窗翻译
1. 选择来源语言（或保留自动检测）与目标语言
2. 在输入框粘贴/输入待翻译的文本
3. 点击“开始翻译”
4. 首次使用可能会触发模型下载（页面会显示下载进度），下载完成后开始翻译
5. 翻译完成后，可复制结果；点击 “朗读”按钮可朗读结果

### 选中文本翻译（v1.2.0新增）
1. 在任意网页上选中文本
2. 插件会自动检测文本语言
3. 如果检测到的语言与目标语言相同，会自动切换到下一个语言进行翻译
4. 翻译结果会浮现在选中文本的斜上方，包含复制按钮
5. **点击复制按钮可一键复制翻译结果到剪贴板**
6. 取消选中后翻译结果自动消失

**智能语言切换示例：**
- 目标语言设为中文时，选中中文文本 → 自动翻译为英文
- 目标语言设为英文时，选中英文文本 → 自动翻译为日文
- 目标语言设为日文时，选中日文文本 → 自动翻译为韩文

**复制功能特点：**
- 🎯 翻译结果浮动框包含复制按钮
- 📋 一键复制翻译结果到系统剪贴板
- ✅ 复制成功时按钮变绿显示"已复制"
- ❌ 复制失败时按钮变红显示"复制失败"
- 🔄 支持现代浏览器的 Clipboard API 和旧版浏览器兼容

**选中翻译特点：**
- 🎯 自动语言检测
- 🚀 即选即译
- 💫 优雅的浮动显示
- 🎨 美观的动画效果
- 🛡️ 智能过滤（跳过数字、符号等）
- ⚡ 防抖动处理
- 🔄 智能语言切换（源语言与目标语言相同时自动切换到下一个语言）
- 📋 一键复制翻译结果

### 网页翻译
- **自动翻译**：开启后，新打开的网页会自动翻译
- **手动翻译**：点击"翻译当前网页"按钮手动翻译
- **智能设置**：只有在自动翻译开启且页面已翻译时，切换目标语言才会实时重新翻译

## 插件截图

![插件截图](/image/Translator.png)

## 常见问题（FAQ）
- 首次使用提示需要下载模型？
  - 正常现象。等待下载完成后即可离线使用。
- 提示语言冲突？
  - 某些来源/目标组合不可用，建议切换其他目标语言重试。
- 朗读没有声音？
  - 请确认系统音量与可用语音包（不同系统/浏览器对语音合成支持不同）。

## License
本项目采用 Apache License 2.0 开源协议。

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

## 隐私政策

Translator 是开源软件。我们尊重您的隐私权。我们不会采集您的任何数据，所有数据均在您的本地进行使用，不会将您的数据提供给任何人。

当然，您不必听信我们的一家之言。您可以通过阅读源代码来了解 Translator(https://github.com/AnYi-0/Translator/) 的具体行为，或者咨询该方面的专业人士。

Translator is open source software. We respect your privacy rights. We will not collect any data from you, all data will be used locally, and your data will not be provided to anyone.

Of course, you don't have to listen to our family. You can read the source code to learn about the specific behavior of Translator(https://github.com/AnYi-0/Translator/), or consult a professional in the field.