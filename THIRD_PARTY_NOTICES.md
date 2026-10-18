# 第三方组件说明

本项目使用 npm 安装第三方依赖，没有将第三方实现复制到 `src/`。

| 组件                                          | 用途               | 许可证     |
| --------------------------------------------- | ------------------ | ---------- |
| React / React DOM                             | 交互界面           | MIT        |
| VexFlow                                       | 标准乐谱 SVG 渲染  | MIT        |
| Vite / React Vite 插件                        | 开发及静态打包     | MIT        |
| Tailwind CSS / PostCSS 插件                   | 样式构建和基础样式 | MIT        |
| TypeScript                                    | 类型检查           | Apache-2.0 |
| @types/react / @types/react-dom / @types/node | 类型声明           | MIT        |

VexFlow 还内嵌 Bravura、Academico、Petaluma、Petaluma Script 和 Gonville 字体。前四种字体采用 SIL Open Font License 1.1，Gonville 的具体条款见其 `LICENCE.txt`。这些字体不由本项目重新授权。

运行时组件及内嵌字体的版权和许可证原文附在 `public/licenses/`，构建时会自动复制到 `dist/licenses/`，部署时请保留该目录。字体许可证来自相应 `@vexflow-fonts` 包，保留版权与保留名称说明。

依赖的精确版本及传递依赖记录在 `package-lock.json`，其他许可证原文由安装后的各依赖包提供。重新分发依赖或构建成品时应一并保留相应版权与许可信息。项目自身的 MIT 授权不替代第三方组件的许可证。
