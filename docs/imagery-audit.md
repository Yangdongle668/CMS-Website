# 网站配图检查与替换

本次检查覆盖当前 CMS 的 53 篇文章、22 个页面、6 个已录入应用、3 个产品分类及 5 个产品，同时检查静态应用页面（含电动工具和工业手持终端）。文章正文目前没有内嵌图片，因此文章更新覆盖封面与头图。

## 发现的问题

- 电池寿命与衰减文章使用地球夜景，医疗设备使用心脏模型，多个不同主题共用电路板照片。
- 一些首页产品卡、文章封面和产品变体引用的文件不存在；5 个产品没有封面。
- 通用图库照片与电池行业场景不符，静态 HTML 和 CMS 数据库同时保存了图片引用，需要同步更新。

## 已替换的图片

共 72 张 AI 生成的场景示意图，其中 53 张对应独立文章，其余用于产品、工厂、工程与应用场景。源文件统一为 WebP，并提供 480、768、1280 像素的响应式版本。

生成图片用于解释场景，不是企业实拍、产品尺寸证明或认证证据。Logo 保留；认证只保留名称，不生成虚假证书。原有图库文件保留以便追溯，但页面和默认内容不再引用。

## 文章配图

| 文章 | 新配图 |
| --- | --- |
| How to Choose Li-Po Battery Capacity for IoT Devices | [how-to-choose-li-po-capacity-iot](../public/assets/img/generated/article-how-to-choose-li-po-capacity-iot.webp) |
| Designing Curved Polymer Batteries for Wearable Devices | [designing-curved-batteries-for-wearables](../public/assets/img/generated/article-designing-curved-batteries-for-wearables.webp) |
| LIR vs. ML Coin Cells: Which Rechargeable Chemistry to Choose | [lir-vs-ml-coin-cell-which-to-choose](../public/assets/img/generated/article-lir-vs-ml-coin-cell-which-to-choose.webp) |
| Designing an Ultra-Thin Battery for AR Glasses | [ar-thin-battery](../public/assets/img/generated/article-ar-thin-battery.webp) |
| The AR/VR Battery Market in 2026 | [ar-vr-market-2026](../public/assets/img/generated/article-ar-vr-market-2026.webp) |
| Protection PCM vs Smart Battery: When to Use Which | [bms-pcm-smart](../public/assets/img/generated/article-bms-pcm-smart.webp) |
| Sizing a Cell From a Power Profile | [cell-sizing](../public/assets/img/generated/article-cell-sizing.webp) |
| China's Medical Device Battery Landscape | [china-medical-battery](../public/assets/img/generated/article-china-medical-battery.webp) |
| Supply Chain Notes: Cobalt, Nickel, LFP Outlook | [cobalt-nickel-lfp](../public/assets/img/generated/article-cobalt-nickel-lfp.webp) |
| Reading a Cycle-Life Curve Honestly | [cycle-life-curves](../public/assets/img/generated/article-cycle-life-curves.webp) |
| The EU Battery Passport: Timeline & Data Requirements | [eu-battery-passport](../public/assets/img/generated/article-eu-battery-passport.webp) |
| HV LCO at 4.48 V: Density Gains for Wearables | [hv-lco-density](../public/assets/img/generated/article-hv-lco-density.webp) |
| Lithium Air Freight in 2025: New Rules, Higher Costs | [lithium-air-freight](../public/assets/img/generated/article-lithium-air-freight.webp) |
| Shipping Lithium: DGR Basics for Product Managers | [lithium-shipping](../public/assets/img/generated/article-lithium-shipping.webp) |
| Second-Life Cells: Who's Buying, Who's Selling | [second-life-cells](../public/assets/img/generated/article-second-life-cells.webp) |
| Solid-State: Hype vs Reality for Consumer Electronics | [solid-state-reality](../public/assets/img/generated/article-solid-state-reality.webp) |
| Thermal Runaway: What Triggers It, How to Design Against It | [thermal-runaway](../public/assets/img/generated/article-thermal-runaway.webp) |
| Why TWS Earbuds Plateaued — And What Comes Next | [tws-earbuds-next](../public/assets/img/generated/article-tws-earbuds-next.webp) |
| UN 38.3 & IEC 62133: What OEMs Need to Know | [un-iec-compliance](../public/assets/img/generated/article-un-iec-compliance.webp) |
| Choosing Between LiPo, Li-ion and LiFePO4 for Wearables | [wearable-chemistry](../public/assets/img/generated/article-wearable-chemistry.webp) |
| Managing Skin-Contact Temperature on Wearables | [wearable-thermal](../public/assets/img/generated/article-wearable-thermal.webp) |
| Designing the Reflow Profile for an SMD-Mounted ML Coin Cell | [reflow-profile-ml-coin-cell](../public/assets/img/generated/article-reflow-profile-ml-coin-cell.webp) |
| Tab Welding Coin Cells: When to Pick Nickel, Copper or Through-Hole Posts | [coin-cell-tab-welding](../public/assets/img/generated/article-coin-cell-tab-welding.webp) |
| Why Hearing Aids Use Pin Coin Cells (and What That Means for Your Wearable) | [coin-cell-hearing-aid](../public/assets/img/generated/article-coin-cell-hearing-aid.webp) |
| Designing RTC Backup with a Reflow-Mounted ML Coin Cell | [coin-cell-rtc-backup](../public/assets/img/generated/article-coin-cell-rtc-backup.webp) |
| Coin Cells in the Cold: How LIR and ML Behave from -40 °C to +85 °C | [coin-cell-low-temp](../public/assets/img/generated/article-coin-cell-low-temp.webp) |
| IEC 62133-2 for Coin Cells: What Tests Apply and What You Have to Pay For | [coin-cell-iec-62133-2](../public/assets/img/generated/article-coin-cell-iec-62133-2.webp) |
| IEC 62133-2:2017 + Amendment 1: The Complete Test Walkthrough | [iec-62133-2-full-walkthrough](../public/assets/img/generated/article-iec-62133-2-full-walkthrough.webp) |
| LiPo Battery Swelling: Root Causes, Risk Levels and Design Fixes | [lipo-battery-swelling-causes](../public/assets/img/generated/article-lipo-battery-swelling-causes.webp) |
| Four Mechanisms of Capacity Fade in Lithium-Polymer Cells | [lithium-battery-capacity-fade](../public/assets/img/generated/article-lithium-battery-capacity-fade.webp) |
| CC/CV Charging: How the Protocol Works and Where It Goes Wrong | [cc-cv-charging-protocol](../public/assets/img/generated/article-cc-cv-charging-protocol.webp) |
| Series vs Parallel Cell Configurations: A Pack Designer's Guide | [parallel-series-cell-configuration](../public/assets/img/generated/article-parallel-series-cell-configuration.webp) |
| BMS Topology Selection: A Decision Framework for OEMs | [bms-topology-selection-guide](../public/assets/img/generated/article-bms-topology-selection-guide.webp) |
| Formation Cycling: The Manufacturing Step That Sets a Cell's Entire Life | [formation-cycling-impact](../public/assets/img/generated/article-formation-cycling-impact.webp) |
| VC, FEC and LiDFOB: What Electrolyte Additives Do for LiPo Cells | [electrolyte-additives-lipo](../public/assets/img/generated/article-electrolyte-additives-lipo.webp) |
| Stepped and L-Shaped Batteries: Geometry Guide for Wearable Electronics | [stepped-battery-geometry](../public/assets/img/generated/article-stepped-battery-geometry.webp) |
| Custom Battery Tooling: Cost Breakdown and Break-Even Analysis | [custom-battery-tooling-cost](../public/assets/img/generated/article-custom-battery-tooling-cost.webp) |
| Co-designing a Custom Lithium Cell: Six Stages from Concept to Production | [co-design-battery-workflow](../public/assets/img/generated/article-co-design-battery-workflow.webp) |
| Flexible Batteries for Wearables: What's Real in 2026 and What Isn't | [flexible-battery-wearable](../public/assets/img/generated/article-flexible-battery-wearable.webp) |
| Battery Design for Smart Rings: Geometry, Chemistry and Power Budget | [smart-ring-battery-design](../public/assets/img/generated/article-smart-ring-battery-design.webp) |
| Reliability Testing for Custom-Shaped Lithium Cells | [custom-battery-reliability-testing](../public/assets/img/generated/article-custom-battery-reliability-testing.webp) |
| CR2032 vs LIR2032 vs ML2032: A Head-to-Head Coin Cell Comparison | [cr-vs-lir-vs-ml-coin-cell-comparison](../public/assets/img/generated/article-cr-vs-lir-vs-ml-coin-cell-comparison.webp) |
| Cycle Life of Rechargeable Coin Cells: What 500, 1,000 and 2,000 Cycle Ratings Mean | [coin-cell-cycle-life-curves](../public/assets/img/generated/article-coin-cell-cycle-life-curves.webp) |
| Coin Cell Self-Discharge: Doing the 5-Year Shelf Life Math | [coin-cell-self-discharge-shelf-life](../public/assets/img/generated/article-coin-cell-self-discharge-shelf-life.webp) |
| Coin Cell Charging IC Design: MCP73831, BQ24210 and the Trade-Offs | [coin-cell-charging-ic-design](../public/assets/img/generated/article-coin-cell-charging-ic-design.webp) |
| Coin Cell Mounting: Holder vs Solder Tab vs SMD Reflow | [coin-cell-mounting-holder-tab-smd](../public/assets/img/generated/article-coin-cell-mounting-holder-tab-smd.webp) |
| Coin Cell Safety: Short-Circuit, Crush and Vent Behaviour Under Abuse | [coin-cell-safety-abuse-behavior](../public/assets/img/generated/article-coin-cell-safety-abuse-behavior.webp) |
| Designing a 5-Year BLE Beacon with an ML Coin Cell | [ble-beacon-ml-coin-cell-design](../public/assets/img/generated/article-ble-beacon-ml-coin-cell-design.webp) |
| How to Read a Li-Po Datasheet Without Getting Burned | [reading-a-lipo-datasheet](../public/assets/img/generated/article-reading-a-lipo-datasheet.webp) |
| Choosing Connectors and Harnesses for a Custom Li-Po Pack | [battery-connector-harness-selection](../public/assets/img/generated/article-battery-connector-harness-selection.webp) |
| Picking a C-Rate: Why Your Cell Runs Hot at Spec | [c-rate-selection-lipo](../public/assets/img/generated/article-c-rate-selection-lipo.webp) |
| PSE, KC and BIS: The Certifications IEC 62133 Does Not Cover | [pse-kc-bis-regional-certification](../public/assets/img/generated/article-pse-kc-bis-regional-certification.webp) |
| Storage State of Charge: What Happens to Cells in Your Warehouse | [lithium-storage-state-of-charge](../public/assets/img/generated/article-lithium-storage-state-of-charge.webp) |

## 产品与通用场景

| 场景 | 新配图 |
| --- | --- |
| An orderly selection of silver pouch lithium cells, custom shaped cells and polished coin cells on a dark navy engineering workbench, products positioned to the right, generous negative space to left. | [home-battery-range](../public/assets/img/generated/home-battery-range.webp) |
| Several rectangular silver lithium polymer pouch cells in graduated sizes with realistic sealed edges and short red black leads, premium close-up product photograph. | [polymer-cells](../public/assets/img/generated/polymer-cells.webp) |
| A carefully spaced range of custom-shaped silver pouch cells: L-shaped, shallow curved, narrow and stepped, physically credible sealed edges, no conventional cylindrical batteries. | [custom-cells](../public/assets/img/generated/custom-cells.webp) |
| Polished steel rechargeable coin cells in several diameters and thicknesses arranged on a blue-gray matte studio bench, subtle specular light and clear macro detail. | [coin-cells](../public/assets/img/generated/coin-cells.webp) |
| Wide conceptual modern lithium battery assembly cleanroom with orderly stainless steel production equipment, enclosed pouch cell stacking and sealing stations, unbranded facility, no people posing. | [battery-production](../public/assets/img/generated/battery-production.webp) |
| Conceptual battery engineers at an electronics bench reviewing a custom pouch cell and open device shell, precision tools, bright clean laboratory, no readable screens. | [battery-engineering](../public/assets/img/generated/battery-engineering.webp) |
| Prototype lithium pouch cells, precision forming die, digital calipers and a compact vacuum sealing machine on an orderly engineering laboratory bench. | [battery-prototyping](../public/assets/img/generated/battery-prototyping.webp) |
| Rows of individual silver pouch cells clamped in neat formation cycling racks with orderly cables in a clean bright battery facility. | [battery-formation](../public/assets/img/generated/battery-formation.webp) |
| Conceptual contemporary industrial technology office reception with glass-walled battery engineering laboratory visible behind, no logos or signage, quiet premium blue gray palette. | [battery-office](../public/assets/img/generated/battery-office.webp) |
| Conceptual diverse electronics engineering team of four collaborating around small battery prototypes at a clean laboratory workbench, candid natural interaction, no name badges or logos. | [battery-team](../public/assets/img/generated/battery-team.webp) |
| Open engineering notebook with abstract unreadable sketches, pouch cell, coin cell, calipers and a pencil neatly arranged on a dark blue-gray laboratory desk, premium editorial photograph. | [battery-knowledge](../public/assets/img/generated/battery-knowledge.webp) |
| Abstract product editorial still life: compact silver battery module beside a small brushed-metal padlock and a plain closed document folder on a dark navy desk, data protection concept, no text. | [data-privacy](../public/assets/img/generated/data-privacy.webp) |
| Small adhesive wearable medical monitoring patch with a slim battery module and sealed clean packaging on a clinical engineering bench, conceptual medical device not worn by a patient. | [medical-patch](../public/assets/img/generated/medical-patch.webp) |
| White wireless door sensor, temperature sensor and smart lock component beside their compact lithium battery modules on a clean modern home worktop, no logos. | [smart-home](../public/assets/img/generated/smart-home.webp) |
| Rugged industrial barcode scanner and open handheld data terminal with removable lithium battery pack, warehouse shelves softly out of focus, product-focused. | [industrial-handheld](../public/assets/img/generated/industrial-handheld.webp) |
| Unbranded cordless drill, compact lithium tool battery pack and a row of cylindrical cells on a clean workshop bench, no readable logos or markings. | [power-tools](../public/assets/img/generated/power-tools.webp) |
| Rugged portable field radio, compact survey drone and sealed lithium battery modules on a neutral field equipment workbench, civilian surveying scene, no weapons. | [field-equipment](../public/assets/img/generated/field-equipment.webp) |
| Used battery modules being sorted into separate insulated trays on a clean recycling laboratory bench, green foliage softly visible through the window, grounded circular materials concept. | [battery-sustainability](../public/assets/img/generated/battery-sustainability.webp) |
| Round aluminum-laminate lithium polymer pouch cells with sealed edges, polyimide tape and short leads; distinct from steel coin cells. | [round-polymer-cells](../public/assets/img/generated/round-polymer-cells.webp) |

## 验证和部署

- 新检出仓库先运行 `npm ci && npm run images:prepare-scenes`，从已提交的 WebP 主图重建被忽略的响应式输出。当前云环境已生成并验证这些文件。
- `npm run images:audit`：核对生成图片、响应式版本、文件大小和静态页面的缺图/旧图引用。
- `npm test`：包含文章逐篇映射、嵌套 JSON 图片迁移、自定义上传保留和重复迁移检查。
- `npm run build` 和 `npm run lint`。
- `migrate-2026-scene-imagery.sql` 在数据库初始化和服务启动时自动执行，只替换已知默认图及指定产品的空封面；自定义上传 URL 保留。
- 生成图清单和主题说明见 `public/assets/img/generated/manifest.json`。原始生成 PNG 保留于当前工作区 `/workspace/generated_images`；部署仅需仓库内 WebP。

当前验证结果：72 张主图、216 个响应式版本通过检查；完整测试 220 项通过；构建和 lint 通过。

实际服务验证：72 张图片 HTTP 内容与清单 SHA-256 一致，53 篇文章 API 的封面和头图映射一致；桌面首页、手机首页及文章详情页完成浏览器检查。

后续调整：首页首屏图片已按用户要求恢复为原始 `/assets/img/seed/photo-1593642634443-44adaa06623a.jpg`，其余配图保持不变。`images:audit` 为该单张首页原图保留明确例外。
