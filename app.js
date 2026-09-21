const {summaries,rows}=window.MNIST;
const $=id=>document.getElementById(id);
const names={binary_comma:'Jev / 二値化ASCII（カンマ区切り）',binary:'Jev / 二値化ASCII',binary_spaced:'Jev / 二値化ASCII（空白区切り）',grayscale:'Jev / 数値行列',ascii10:'Jev / 濃淡10段階',fixedwidth:'Jev / 数値・3桁幅',gpt5nano:'nano minimal（二値化）',gpt5nano_low:'nano low（二値化）',coordinates:'Jev 座標配列',gpt5nano_coordinates:'nano minimal（座標）',luna_none:'Luna none（二値化）',luna_spaced:'Luna none（二値化・空白区切り）',luna_image5:'Luna none（画像5倍）',luna_image50:'Luna none（画像50倍）',luna_image10:'Luna none（画像10倍）',luna_image:'Luna none（画像）'};
const outcomes={improved:'比較先で正解に',regressed:'比較先で不正解に',both_correct:'両方正解',both_wrong:'両方不正解'};
const modes=Object.keys(summaries);
const comparisonState={a:modes.includes('binary_comma')?'binary':modes.includes('luna_image5')?'luna_image':modes.includes('luna_image50')?'luna_image':modes.includes('luna_image10')?'luna_image':modes.includes('luna_spaced')?'luna_none':'binary',b:modes.includes('binary_comma')?'binary_comma':modes.includes('luna_image5')?'luna_image5':modes.includes('luna_image50')?'luna_image50':modes.includes('luna_image10')?'luna_image10':modes.includes('luna_spaced')?'luna_spaced':modes.includes('binary_spaced')?'binary_spaced':modes.includes('luna_image')?'luna_image':'coordinates'};
const pair=()=>[comparisonState.a,comparisonState.b];
function outcome(r){const [a,b]=pair(),ac=r[a].prediction===r.label,bc=r[b].prediction===r.label;return ac&&bc?'both_correct':bc?'improved':ac?'regressed':'both_wrong'}
let selected=rows[0].index;
function draw(canvas,pixels,binary=false){const ctx=canvas.getContext('2d'),im=ctx.createImageData(28,28);pixels.forEach((v,i)=>{const n=binary?(v>=128?255:0):v;im.data.set([n,n,n,255],i*4)});ctx.putImageData(im,0,0)}
function filtered(){return rows.filter(r=>($('digit').value==='all'||r.label===Number($('digit').value))&&($('status').value==='all'||outcome(r)===$('status').value))}
function badge(pred,label){if(pred===null)return '<span class="badge error">未完了・無効</span>';return `<span class="badge ${pred===label?'correct':'error'}">${pred===label?'正解':'誤判定'}</span>`}
function details(index){selected=index;const r=rows.find(r=>r.index===index);if(!r)return;document.querySelectorAll('.sample').forEach(b=>{const active=Number(b.dataset.index)===index;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active))});$('sample-id').textContent=`test #${r.index}`;draw($('gray'),r.pixels);$('verdict').innerHTML=`<div><small>正解</small><span class="value">${r.label}</span></div>`+modes.map(m=>`<div><small>${names[m]}</small><span class="value">${r[m].prediction??'—'}</span>${badge(r[m].prediction,r.label)}</div>`).join('');inputDetails(r);$('probabilities').innerHTML=Array.from({length:10},(_,i)=>`<div class="paired-bar"><span class="digit ${i===r.label?'truth':''}">${i}</span><div>${pair().map((m,n)=>`<div class="bar-row ${n===0?'binary':'grayscale'}"><div class="track"><div class="fill" style="width:${r[m].probabilities?r[m].probabilities[i]*100:0}%"></div></div><span>${r[m].probabilities?(r[m].probabilities[i]*100).toFixed(0)+'%':'—'}</span></div>`).join('')}</div></div>`).join('');const mismatches=modes.filter(m=>summaries[m].choice_not_max_probability_indices.includes(index));$('mismatch').hidden=!mismatches.length;$('mismatch').textContent=mismatches.map(m=>names[m]).join('・')+'：APIの選択結果と確率分布の最大値に不一致があります。採点には選択結果を使用しています。';$('timing').textContent=(pair().some(m=>summaries[m].model.startsWith('gpt-'))?'OpenAIモデルは数字のみを取得しており、確率分布はありません。 ':'')+modes.map(m=>`${names[m]} ${r[m].seconds.toFixed(3)}秒`).join(' / ')}
function render(){const list=filtered();$('results-count').textContent=`${list.length} / 100件`;$('results-digit').value=$('digit').value;$('results-status').value=$('status').value;$('count').textContent=`${list.length} / 100件`;$('gallery').replaceChildren();$('results').replaceChildren();for(const r of list){const b=document.createElement('button');b.className='sample';b.dataset.index=r.index;b.setAttribute('aria-label',`サンプル${r.index} 正解${r.label} ${modes.map(m=>names[m]+(r[m].prediction??'未完了')).join(" ")}`);b.innerHTML=`<canvas width="28" height="28"></canvas><small>正解 ${r.label}</small><small>${pair().map((m,n)=>`<span class="${r[m].prediction===r.label?'correct':'error'}">${n===0?'元':'先'} ${r[m].prediction??'—'}</span>`).join('')}</small>`;draw(b.querySelector('canvas'),r.pixels);b.onclick=()=>details(r.index);$('gallery').append(b);const tr=document.createElement('tr');tr.innerHTML=`<td><button class="row-link">#${r.index}</button></td><td><canvas class="thumb" width="28" height="28" aria-label="数字${r.label}の元画像"></canvas></td><td>${r.label}</td>${pair().map(m=>`<td><strong>${r[m].prediction??'—'}</strong> ${badge(r[m].prediction,r.label)}<small class="cell-time">${r[m].seconds.toFixed(3)} 秒</small></td>`).join('')}<td>${outcomes[outcome(r)]}</td>`;draw(tr.querySelector('canvas'),r.pixels);tr.querySelector('button').onclick=()=>{details(r.index);document.querySelector('.detail').scrollIntoView({behavior:'smooth',block:'start'})};$('results').append(tr)}$('detail-content').hidden=!list.length;$('empty-detail').hidden=!!list.length;if(list.length)details(list.some(r=>r.index===selected)?selected:list[0].index);else{$('gallery').textContent='条件に合うサンプルがありません。';$('sample-id').textContent='';$('results').innerHTML=`<tr><td colspan="6">条件に合うサンプルがありません。</td></tr>`}}
const metrics=[['推論設定',s=>s.reasoning_effort||'—'],['無効・未完了出力',s=>(s.invalid_outputs||0)+'件'],['モデル',s=>s.model],['費用概算（USD）',s=>'$'+s.estimated_cost_usd.toFixed(6)],['出力トークン',s=>s.output_tokens.toLocaleString()],['推論トークン',s=>s.reasoning_tokens==null?'—':s.reasoning_tokens.toLocaleString()],['正解率',s=>(s.accuracy*100).toFixed(0)+'%'],['平均応答時間',s=>s.mean_seconds.toFixed(3)+'秒'],['p95応答時間',s=>s.p95_seconds.toFixed(3)+'秒'],['入力トークン（100件合計）',s=>s.input_tokens.toLocaleString()],['選択結果と最大確率の不一致',s=>s.model.startsWith('gpt-')?'対象外':s.choice_not_max_probability_indices.length+'件']];
const overviewNames={binary_comma:'二値化ASCII（カンマ区切り）',binary:'二値化ASCII',binary_spaced:'二値化ASCII（空白区切り）',grayscale:'数値行列',ascii10:'濃淡10段階',fixedwidth:'数値・3桁幅',coordinates:'座標配列'};
function overviewTable(id,group,labels){
 $(id).innerHTML='<thead><tr><th>指標</th>'+group.map(m=>`<th scope="col">${labels[m]}</th>`).join('')+'</tr></thead><tbody>'+metrics.map(([name,f])=>`<tr><th scope="row">${name}</th>${group.map(m=>`<td>${f(summaries[m])}</td>`).join('')}</tr>`).join('')+'</tbody>';
}
const chartColors={binary_comma:'#d18d20',binary:'#277fce',binary_spaced:'#c05283',grayscale:'#8256c4',ascii10:'#18836b',fixedwidth:'#b06b22',coordinates:'#52657e',gpt5nano:'#8256c4',gpt5nano_low:'#18836b',luna_none:'#b06b22',luna_spaced:'#c05283',luna_image5:'#b06b22',luna_image50:'#8256c4',luna_image10:'#18836b',luna_image:'#277fce'};
const chartModes=['binary','binary_spaced','binary_comma','grayscale','ascii10','fixedwidth','coordinates','gpt5nano','gpt5nano_low','luna_none','luna_spaced','luna_image','luna_image5','luna_image10','luna_image50'].filter(m=>modes.includes(m));
function niceMax(value){if(value<=0)return 1;const power=10**Math.floor(Math.log10(value));return Math.ceil(value/power)*power;}
const chartSpecs=[
 {title:'精度（正解率）',hint:'高いほど良い',value:s=>s.accuracy,max:1,format:v=>(v*100).toFixed(0)+'%',tick:v=>(v*100).toFixed(0)+'%'},
 {title:'入力トークン（100件合計）',hint:'説明文などを含む入力全体 · API実測',value:s=>s.input_tokens,max:niceMax(Math.max(...chartModes.map(m=>summaries[m].input_tokens))),format:v=>v.toLocaleString('ja-JP'),tick:v=>v.toLocaleString('ja-JP')},
 {title:'コスト（100件の概算）',hint:'低いほど良い · USD',value:s=>s.estimated_cost_usd,max:niceMax(Math.max(...chartModes.map(m=>summaries[m].estimated_cost_usd))),format:v=>'$'+v.toFixed(6),tick:v=>'$'+v.toFixed(3)},
 {title:'時間（1件の平均）',hint:'短いほど良い',value:s=>s.mean_seconds,max:niceMax(Math.max(...chartModes.map(m=>summaries[m].mean_seconds))),format:v=>v.toFixed(3)+' 秒',tick:v=>v.toFixed(1)+' 秒'}
];
function overviewGroup(id,group,labels){
 const available=group.filter(m=>modes.includes(m));
 const container=$(id+'-metrics');container.className='overview-charts';
 container.innerHTML=chartSpecs.map(spec=>`<figure class="metric-chart"><figcaption><strong>${spec.title}</strong><span>${spec.hint}</span></figcaption><ol>${available.map(m=>{const value=spec.value(summaries[m]);return `<li><div class="chart-label"><span>${labels[m]}</span><strong>${spec.format(value)}</strong></div><div class="chart-track" aria-hidden="true"><div class="chart-bar" style="width:${value/spec.max*100}%;background:${chartColors[m]}"></div></div></li>`}).join('')}</ol><div class="chart-axis" aria-hidden="true"><span>${spec.tick(0)}</span><span>${spec.tick(spec.max/2)}</span><span>${spec.tick(spec.max)}</span></div></figure>`).join('')+'<p class="chart-footnote">棒は0起点。同じ指標は上下のグループで同じ目盛りです。精度は100枚の正解率、費用はAPI使用量からの概算、時間は通信を含む実測値です。</p>';
 overviewTable(id+'-comparison',available,labels);
}
if(summaries.binary_spaced&&summaries.binary_comma){const a=summaries.binary,b=summaries.binary_spaced,c=summaries.binary_comma;$('spacing-result').textContent=`二値化ASCIIの正解率は、区切りなし${a.correct}%、空白区切り${b.correct}%、カンマ区切り${c.correct}%でした。入力トークン数はそれぞれ${a.input_tokens.toLocaleString()}、${b.input_tokens.toLocaleString()}、${c.input_tokens.toLocaleString()}（100件合計）。今回の100枚では、区切りを入れても正解率は改善しませんでした。`;}
overviewGroup('encoding',['binary','binary_spaced','binary_comma','grayscale','ascii10','fixedwidth','coordinates'],overviewNames);
overviewGroup('model',['binary','gpt5nano','gpt5nano_low','luna_none'],{binary:'Jev',gpt5nano:'nano / minimal',gpt5nano_low:'nano / low',luna_none:'Luna / none'});
if(summaries.luna_image5){const a=summaries.luna_none,b=summaries.luna_spaced;$('vision-result').textContent=`Lunaのテキスト入力の正解率は、二値化ASCIIの区切りなし${a.correct}%、空白区切り${b.correct}%でした。画像入力は28×28で${summaries.luna_image.correct}%、140×140（5倍）で${summaries.luna_image5.correct}%、280×280（10倍）で${summaries.luna_image10.correct}%、1400×1400（50倍）で${summaries.luna_image50.correct}%。今回試した画像サイズでは5倍拡大が最も高く、拡大倍率と正解率は単純な比例関係にはなりませんでした。`;}
overviewGroup('vision',['binary','luna_none','luna_spaced','luna_image','luna_image5','luna_image10','luna_image50'],{binary:'Jev / 二値化ASCII',binary_spaced:'Jev / 二値化ASCII（空白区切り）',luna_none:'Luna / 二値化ASCII',luna_spaced:'Luna / ASCII（空白区切り）',luna_image5:'Luna / PNG 5倍拡大',luna_image50:'Luna / PNG 50倍拡大',luna_image10:'Luna / PNG 10倍拡大',luna_image:'Luna / 元画像PNG'});
overviewTable('extra-comparison',['gpt5nano','gpt5nano_coordinates'].filter(m=>modes.includes(m)),names);

function updatePair(){document.querySelectorAll('[data-compare-side]').forEach(select=>{select.value=comparisonState[select.dataset.compareSide]});const [a,b]=pair(),counts={both_correct:0,improved:0,regressed:0,both_wrong:0};rows.forEach(r=>counts[outcome(r)]++);$('paired').textContent=`${names[a]} → ${names[b]}： `+Object.entries(counts).map(([k,n])=>`${outcomes[k]} ${n}件`).join(' / ');$('legend').textContent=`青：${names[a]} / 紫：${names[b]}`;$('matrix-name-a').textContent=names[a];$('matrix-name-b').textContent=names[b];$('matrix').setAttribute('aria-label',names[a]+'の混同行列');$('matrix-gray').setAttribute('aria-label',names[b]+'の混同行列');matrix('matrix',summaries[a]);matrix('matrix-gray',summaries[b]);
for(const id of ['results-pair','matrix-pair-context','samples-pair-context'])$(id).textContent=`共通の比較：${names[a]} → ${names[b]}`;
for(const [side,mode] of [['a',a],['b',b]]){
 const summary=summaries[mode];
 $('matrix-summary-'+side).textContent=`正解 ${summary.correct} / 100件 · 不正解 ${100-summary.correct}件（うち無効 ${summary.invalid_outputs||0}件）`;
 const errors=[];summary.confusion_matrix_true_rows_predicted_columns.forEach((row,truth)=>row.forEach((count,prediction)=>{if(truth!==prediction&&count)errors.push({truth,prediction,count})}));errors.sort((x,y)=>y.count-x.count||x.truth-y.truth||x.prediction-y.prediction);
 $('matrix-errors-'+side).innerHTML='<small>多い取り違え（正解 → 予測）</small><p>'+ (errors.slice(0,3).map(e=>`${e.truth} → ${e.prediction}：${e.count}件`).join(' / ')||'取り違えなし')+'</p>';
}
$('results-head').innerHTML=`<tr><th>サンプル</th><th>元画像</th><th>正解</th><th class="source-heading">比較元<br>${names[a]}<small class="cell-time">予測 / 応答時間</small></th><th class="target-heading">比較先<br>${names[b]}<small class="cell-time">予測 / 応答時間</small></th><th>比較結果</th></tr>`;render()}
function matrix(id,s){$(id).innerHTML='<thead><tr><th scope="col">正解 / 予測</th>'+Array.from({length:10},(_,i)=>`<th scope="col">${i}</th>`).join('')+'</tr></thead><tbody>'+s.confusion_matrix_true_rows_predicted_columns.map((row,i)=>`<tr><th scope="row">${i}</th>`+row.map((n,j)=>`<td style="background:${n?(i===j?`rgba(58,174,142,${.12+n*.045})`:`rgba(215,103,88,${.1+n*.04})`):'#f8fafc'}">${n}</td>`).join('')+'</tr>').join('')+'</tbody>'}

const formats={
 binary_comma:{title:'二値化ASCII（カンマ区切り）',description:'画素値128以上を #、それ以外を . に置換し、画素間を半角カンマで区切ります。28行×28画素、末尾カンマなし。元の二値化ASCIIと画素情報は同一で、カンマは画素ではないと説明しています。'},
 binary_spaced:{title:'二値化ASCII（空白区切り）',description:'画素値128以上を #、それ以外を . に変換し、全ての画素の間に半角空白を1つ挿入。28行×28画素で、空白は画素に数えません。元の二値化ASCIIと画素情報は同一です。'},
 image5:{title:'画像入力（PNG・5倍拡大）',description:'28×28の元画像を最近傍法で140×140に拡大。各画素を5×5に複製し、濃淡を保持。二値化なし、detail=original。説明文の寸法表記は140×140に変更。'},
 image10:{title:'画像入力（PNG・10倍拡大）',description:'28×28の元画像を最近傍法で280×280に拡大。各画素を10×10に複製し、濃淡を保持。二値化なし、detail=original。説明文の寸法表記は280×280に変更。'},
 image50:{title:'画像入力（PNG・50倍拡大）',description:'28×28の元画像を最近傍法で1400×1400に拡大。各画素を50×50に複製し、濃淡を保持。二値化なし、detail=original。説明文の寸法表記は1400×1400に変更。'},
 image:{title:'画像入力（PNG）',description:'元の28×28・8-bitグレースケールをPNGで保持し、画像入力として送信。拡大・二値化なし、detail=original。Base64は画像の転送用で、文字列として読ませる実験ではありません。'},
 binary:{title:'二値化ASCII',description:'画素値128以上を #、それ以外を . に置き換えた28行の格子。白黒の形を残し、濃淡は省きます。'},
 grayscale:{title:'数値行列',description:'元の画素値0〜255をカンマ区切りの28行で表現。0は黒、255は白。元画像の濃淡をすべて保持します。'},
 ascii10:{title:'濃淡10段階',description:'暗い順に「空白 . : - = + * # % @」の10文字で表現。濃淡を10段階にまとめ、文字の並びで形を伝えます。'},
 fixedwidth:{title:'数値・3桁幅',description:'数値行列と同じ0〜255を、空白で右寄せして3文字幅に揃えます。値と説明文は同一で、桁揃えだけが異なります。'},
 coordinates:{title:'座標配列',description:'画素値128以上の位置だけを[x,y]で列挙。左上が[0,0]、右向きにx、下向きにyが増えます。記載のない画素は0。二値化ASCIIと同じ画素情報です。'}
};
let activeFormat='coordinates';
function formatOf(mode){return mode==='luna_image5'?'image5':mode==='luna_image50'?'image50':mode==='luna_image10'?'image10':mode==='luna_spaced'?'binary_spaced':mode==='luna_image'?'image':mode.includes('coordinates')?'coordinates':summaries[mode].model.startsWith('gpt-')?'binary':mode}
function setFormat(format){
 activeFormat=format;const previous=$('request-mode').value;
 $('request-mode').replaceChildren();
 for(const m of modes.filter(m=>formatOf(m)===format))$('request-mode').add(new Option(names[m],m));
 if(modes.includes(previous)&&formatOf(previous)===format)$('request-mode').value=previous;
 else if(previous.startsWith('gpt5nano')){const nano=modes.find(m=>m.startsWith('gpt5nano')&&formatOf(m)===format);if(nano)$('request-mode').value=nano;}
 document.querySelectorAll('.format-option').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.format===format)));
 inputDetails(rows.find(r=>r.index===selected));
}
function inputDetails(r){
 const mode=$('request-mode').value,req=r[mode].request,state=req.state||req.input;
 $('lab-sample').textContent=`test #${r.index} · 正解 ${r.label}`;
 $('format-description').textContent=formats[activeFormat].description;
 $('input-grid').textContent=['image','image5','image10','image50'].includes(activeFormat) ? state[0].content[0].text+'\n\n[画像入力：'+(activeFormat==='image5'?'140×140 PNG / 最近傍法5倍拡大':activeFormat==='image50'?'1400×1400 PNG / 最近傍法50倍拡大':activeFormat==='image10'?'280×280 PNG / 最近傍法10倍拡大':'28×28 PNG')+' / detail=original]\n実際の画像データは下のリクエスト全文で確認できます。' : state.slice(state.indexOf('\n')+1).split('\n\n')[0];
 $('input-grid').classList.toggle('coordinates',activeFormat==='coordinates');
 $('request').textContent=JSON.stringify(req,null,2);
 $('input-note').textContent='この表現で評価済みの設定のみ選べます。切り替えによるAPI呼び出し・追加費用はありません。';
 const pixels=activeFormat==='ascii10'?r.pixels.map(p=>Math.round(Math.floor(p*10/256)*255/9)):r.pixels;
 draw($('encoding-preview'),pixels,['binary','binary_spaced','binary_comma','coordinates'].includes(activeFormat));
 $('encoding-result').textContent=`保存済みの予測：${r[mode].prediction??'無効'} / 正解：${r.label} / 入力：${r[mode].input_tokens.toLocaleString()}トークン`;
}
$('format-options').innerHTML=Object.entries(formats).map(([key,f])=>`<button type="button" class="format-option" data-format="${key}" aria-pressed="false">${f.title}</button>`).join('');
for(const button of document.querySelectorAll('.format-option'))button.onclick=()=>setFormat(button.dataset.format);
for(let i=0;i<10;i++)$('digit').add(new Option(String(i),String(i)));
for(const select of document.querySelectorAll('[data-compare-side]')){
 for(const m of modes)select.add(new Option(names[m],m));
 select.onchange=()=>{comparisonState[select.dataset.compareSide]=select.value;updatePair()};
}
for(const kind of ['digit','status']){
 for(const option of $(kind).options)$('results-'+kind).add(new Option(option.text,option.value));
 $('results-'+kind).onchange=()=>{$(kind).value=$('results-'+kind).value;render()};
}

setFormat(modes.includes('binary_comma')?'binary_comma':modes.includes('luna_image5')?'image5':modes.includes('luna_image50')?'image50':modes.includes('luna_image10')?'image10':modes.includes('binary_spaced')?'binary_spaced':'binary');
if(!modes.includes('binary_comma')&&!modes.includes('luna_image5')&&!modes.includes('luna_image50')&&!modes.includes('luna_image10')&&modes.includes('luna_spaced'))$('request-mode').value='luna_spaced';
$('digit').onchange=render;$('status').onchange=render;$('request-mode').onchange=()=>inputDetails(rows.find(r=>r.index===selected));updatePair();
