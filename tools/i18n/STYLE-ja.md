# 日本語訳のスタイルガイド（臨床本文）

目標: 日本の医学部・研修医教育で使われる神経解剖・神経内科の日本語。読者は医師・医学生・リハビリ職。講義ノートと臨床のリファレンスのように読め、翻訳臭がしないこと。**局在診断で致命的になる左右・同側／対側・否定は、英語と一語ずつ対応させる。**

## ルール
1. **全文を訳す。省略・要約・追加をしない。** 文の数と情報量を保つ。長い文は日本語として自然な位置で二つに分けてよい。
2. **構造名は日本語解剖学用語**（日本解剖学会の用語）。初出時に英語名を括弧で添える: 「内包後脚（posterior limb of the internal capsule）」。2回目以降は日本語のみ。表示名は `content/i18n/ja/names.json` の表に合わせる（同じ構造は本文中でも必ず同じ日本語名）。例: 延髄、橋、中脳、視床、被殻、尾状核、淡蒼球、内包、放線冠、大脳脚、錐体、錐体交叉、内側毛帯、外側脊髄視床路、後索、薄束核、楔状束核、疑核、孤束核、迷走神経背側核、下小脳脚、上小脳脚、歯状核、外側膝状体、内側膝状体、上丘、下丘、赤核、黒質、青斑核、網様体、内側縦束、脳弓、乳頭体、海馬、扁桃体、島、帯状回、中心前回、中心後回、上側頭回、角回、縁上回、脳梁。
3. **臨床用語は日本の医学用語で**: 病巣、脱落症状、脳卒中、梗塞、出血、片麻痺、不全片麻痺、構音障害、嚥下障害、失調、眼振、眼瞼下垂、縮瞳、散瞳、複視、半盲、失語、失行、失認、けいれん発作、めまい、回転性めまい、脱力、しびれ、感覚低下、感覚脱失、反射、痙縮、固縮、振戦、クローヌス、バビンスキー徴候、ホルネル症候群、脳ヘルニア、水頭症、腫瘤効果、正中偏位、動脈瘤、解離、血管攣縮、脱髄、浮腫、造影効果、意識障害、昏睡。
4. **左右・側性・否定（最重要）**: left → 左、right → 右、ipsilateral → 同側、contralateral → 対側、bilateral → 両側、unilateral → 片側、crossed → 交叉性、uncrossed → 非交叉性。「病巣と同側」「病巣の対側」のように、何に対して同側／対側かが英語で明示されている場合はそれも訳す。spared / preserved / intact → 保たれる、absent → 消失／欠如、no / not / without → 「〜ない」「〜なし」を必ず残す。「no weakness」を「脱力」と訳すような否定の脱落は最悪の誤りである。
5. **画像の用語**: MRI、CT、CTA、MRA、DSA、拡散強調画像（DWI）、ADC、FLAIR、T1 強調像、T2 強調像、SWI、GRE、造影 T1；高信号、低信号、高吸収、低吸収、拡散制限、造影効果、軸位断、冠状断、矢状断、断面。
6. **エポニムと症候群名**: 「ワレンベルグ症候群」ではなく「Wallenberg 症候群」「Weber 症候群」「Brown-Séquard 症候群」「Broca 野」「Wernicke 野」のように人名はアルファベットのまま。症候群名（name 欄）は訳す: 「Lateral medullary syndrome (Wallenberg)」→「延髄外側症候群（Wallenberg）」。
7. **略語**は英語の定着形のまま: MLF、PICA、AICA、SCA、ACA、MCA、PCA、ICA、CN III（本文では「動眼神経（CN III）」のように併記可）、DWI、CSF（髄液）、EMG、EEG、LP（腰椎穿刺）。
8. **数値・単位・座標・MNI 値・薬の用量・キー操作・リンクは変えない。** Markdown を保つ: `**太字**`、箇条書き、`[文字](#/structure/id)` はリンク先をそのまま、文字だけ訳す。
9. **高位**: 「C5–T1」などの髄節名はそのまま。above / below → より上／より下、rostral / caudal → 吻側／尾側、anterior / posterior → 前／後（解剖の文脈では前方／後方）、medial / lateral → 内側／外側、dorsal / ventral → 背側／腹側。
10. **文体**: 常体（だ・である）、簡潔、断定は英語の確信度を保つ（typically → 典型的には、often → しばしば、usually → 通常、may → 〜しうる）。主語は「患者」。クイズの症例文は症例提示の文体: 「52 歳女性。…」。
11. **用語の一貫性**: 同じ英語は常に同じ日本語に。迷ったら下の表に従う。表にない場合は日本の教科書（医学書院・南山堂の神経内科・神経解剖学）で標準的な語を選ぶ。
12. 用語集の見出し（glossary `term`）: 日本語の用語、必要なら英語を括弧で: 「交叉（decussation）」「失調（ataxia）」。
13. 句読点は全角「、」「。」。英数字と日本語の間にスペースは入れない（ただし単位・略語の前後は英語の慣習に従う: 「5 mm」「CN III」）。

## Terms
`prose.py check` はこの表の左右・否定の語を英日で数えて照合する。左列は英語、右列は日本語の対応語（複数は「／」区切り）。

| english | japanese | note |
| :-- | :-- | :-- |
| left | 左 | |
| right | 右 | |
| ipsilateral | 同側 | |
| contralateral | 対側 | |
| bilateral | 両側 | |
| unilateral | 片側 | |
| crossed | 交叉 | 「交叉性」「交叉した」を含む |
| uncrossed | 非交叉 | |
| not | ない／ず／なし／否定 | |
| no | ない／なし／欠如／消失／陰性 | |
| without | なし／を伴わない／ない | |
| spared | 保たれ／温存 | |
| preserved | 保たれ／温存 | |
| intact | 保たれ／正常 | |
| absent | 消失／欠如／みられない／認めない | |
| lesion | 病巣 | 病変も可（病巣を優先） |
| deficit | 脱落症状／障害 | |
| stroke | 脳卒中 | |
| infarct | 梗塞 | |
| hemorrhage | 出血 | |
| weakness | 脱力／筋力低下 | |
| numbness | しびれ | |
| sensory loss | 感覚脱失／感覚障害 | |
| gaze | 注視 | |
| pursuit | 追視 | |
| saccade | 衝動性眼球運動（サッケード） | |
| pupil | 瞳孔 | |
| eyelid | 眼瞼 | |
| swallowing | 嚥下 | |
| hoarseness | 嗄声 | |
| hiccups | 吃逆（しゃっくり） | |
| dizziness | めまい | |
| vertigo | 回転性めまい | |
| pathway | 経路 | |
| tract | 路 | 皮質脊髄路、脊髄視床路 |
| fibers | 線維 | |
| nucleus | 核 | |
| white matter | 白質 | |
| gray matter | 灰白質 | |
| brainstem | 脳幹 | |
| cerebellum | 小脳 | |
| spinal cord | 脊髄 | |
| cranial nerve | 脳神経 | |
| territory | 支配域／灌流域 | |
| watershed | 分水嶺（境界域） | |
| blood supply | 血管支配 | |
| pearl | 要点 | クリニカルパール |
| pitfall | 落とし穴 | |
| mimic | 鑑別すべき病態（mimic） | |
| management | 治療・管理 | |
| examination | 診察 | |
| finding | 所見 | |
| imaging | 画像 | |
| sequence | シーケンス | |
| enhancement | 造影効果 | |
| mass effect | 腫瘤効果 | |
| midline shift | 正中偏位 | |
| lumbar puncture | 腰椎穿刺 | |
| seizure | けいれん発作／発作 | |
| headache | 頭痛 | |
| nausea | 悪心 | |
| vomiting | 嘔吐 | |
| consciousness | 意識 | |
| coma | 昏睡 | |
| localization | 局在（診断） | |
| decussation | 交叉 | |
| upper motor neuron | 上位運動ニューロン | |
| lower motor neuron | 下位運動ニューロン | |
| reflex arc | 反射弓 | |
| afferent | 求心性 | |
| efferent | 遠心性 | |
| ganglion | 神経節 | |
| plexus | 神経叢 | |
| root | 神経根 | |
| dermatome | デルマトーム（皮膚分節） | |
| myotome | ミオトーム（筋分節） | |
| hemiparesis | 不全片麻痺 | |
| hemiplegia | 片麻痺 | |
| ataxia | 失調 | |
| dysarthria | 構音障害 | |
| dysphagia | 嚥下障害 | |
| nystagmus | 眼振 | |
| ptosis | 眼瞼下垂 | |
| miosis | 縮瞳 | |
| mydriasis | 散瞳 | |
| diplopia | 複視 | |
| hemianopia | 半盲 | |
| aphasia | 失語 | |
| apraxia | 失行 | |
| agnosia | 失認 | |
| neglect | 半側空間無視 | |
| spasticity | 痙縮 | |
| rigidity | 固縮 | |
| tremor | 振戦 | |
| clonus | クローヌス | |
| hyperreflexia | 反射亢進 | |
| hyporeflexia | 反射低下 | |
| areflexia | 反射消失 | |
| proprioception | 固有感覚（深部感覚） | |
| vibration | 振動覚 | |
| pain and temperature | 温痛覚 | |
| light touch | 触覚 | |
| fine touch | 識別性触覚 | |
| two-point discrimination | 二点識別覚 | |
| dissociated sensory loss | 解離性感覚障害 | |
| facial | 顔面 | |
| limb | 四肢／上下肢 | |
| trunk | 体幹 | |
