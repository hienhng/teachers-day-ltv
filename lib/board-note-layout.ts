export type BoardNotePosition = {left:number;top:number;rotation:number};
export type BoardReservedArea = {x:number;y:number;width:number;height:number};
export type BoardPaperBounds = BoardReservedArea&{centerX:number;centerY:number};

// Grow together, shifting into nearby gaps when the current position gets tight.
// Measured bounds include tape and stickers; every move preserves clearance.
export function growBoardPapers(papers:BoardPaperBounds[],width:number,height:number,greeting?:BoardReservedArea){
 const padding=8,gap=12,placements=papers.map(()=>({scale:1,offsetX:0,offsetY:0})),boxes:BoardReservedArea[]=papers.map(paper=>({...paper}));
 for(let step=1;step<=50;step++)for(let index=0;index<papers.length;index++){
  const paper=papers[index],scale=1+step*.02,placement=placements[index];
  const box={x:paper.centerX+(paper.x-paper.centerX)*scale+placement.offsetX,y:paper.centerY+(paper.y-paper.centerY)*scale+placement.offsetY,width:paper.width*scale,height:paper.height*scale};
  const maxX=width-padding-box.width,maxY=height-padding-box.height;
  if(maxX<padding||maxY<padding)continue;
  const obstacles=[...boxes.filter((_,otherIndex)=>otherIndex!==index),...(greeting?[greeting]:[])];
  const ys=[Math.max(padding,Math.min(maxY,box.y)),padding,maxY,...obstacles.flatMap(other=>[other.y-box.height-gap,other.y+other.height+gap])];
  let best:{x:number;y:number;distance:number}|undefined;
  for(const y of ys){
   if(y<padding||y>maxY)continue;
   let ranges=[[padding,maxX]];
   for(const other of obstacles){
    if(y>=other.y+other.height+gap||other.y>=y+box.height+gap)continue;
    const start=other.x-box.width-gap,end=other.x+other.width+gap;
    ranges=ranges.flatMap(([low,high])=>end<=low||start>=high?[[low,high]]:[...(start>low?[[low,Math.min(high,start)]]:[]),...(end<high?[[Math.max(low,end),high]]:[])]);
   }
   for(const [low,high] of ranges){
    const x=Math.max(low,Math.min(high,box.x)),distance=(x-box.x)**2+(y-box.y)**2;
    if(!best||distance<best.distance)best={x,y,distance};
   }
  }
  if(!best)continue;
  placements[index]={scale,offsetX:placement.offsetX+best.x-box.x,offsetY:placement.offsetY+best.y-box.y};
  boxes[index]={...box,x:best.x,y:best.y};
 }
 return placements;
}

// Only large, tall boards get denser panels; ordinary screens keep their limits.
function boardPanelDensity(width:number,height:number){
 return width>=2200&&height>=1000?{limit:20,scale:.92,minimum:180}:{limit:8,scale:1,minimum:readableBoardNoteSize(width)};
}

// Give each note its own gentle tilt, independent of shape, size and placement.
// Keep it stable when the note moves to another panel or the viewport resizes.
export function boardNoteRotation(id:string){
 let seed=2166136261;
 for(const char of `rotation:${id}`)seed=Math.imul(seed^char.charCodeAt(0),16777619)>>>0;
 seed=(seed+0x6d2b79f5)>>>0;
 let value=Math.imul(seed^(seed>>>15),1|seed);
 value^=value+Math.imul(value^(value>>>7),61|value);
 return (((value^(value>>>14))>>>0)/4294967296-.5)*10;
}

export function boardPanelCapacity(width:number,height:number,greeting?:BoardReservedArea){
 if(width<1100)return height>=1000?3:2;
 const {limit,scale,minimum}=boardPanelDensity(width,height);
 const reserved=greeting??{x:width>=760?(width-Math.min(360,width*.32))/2:16,y:(height-(width>=760?240:120))/2,width:width>=760?Math.min(360,width*.32):width-32,height:width>=760?240:120};
 for(let count=limit;count>=1;count--)if(panelMetrics(count,width,height,reserved).maxSize*scale>=minimum)return count;
 return 1;
}

export function readableBoardNoteSize(width:number){return width>=760?200:160}

// Follow the visible board in both orientations rather than a fixed pixel cap.
export function boardNoteViewportSize(width:number,height:number){
 return Math.max(1,Math.min(width*(width>=760?.24:.6),height*.42));
}

// Use the busiest panel's available space for one paper size across the board.
export function boardPanelNoteSize(count:number,width:number,height:number,greeting?:BoardReservedArea){
 if(width<1100&&count<=3)return Math.max(1,((width-16)/(width<760?1:Math.min(2,Math.max(1,count)))-24)/1.25);
 return Math.min(boardNoteViewportSize(width,height),panelMetrics(count,width,height,greeting).maxSize);
}

// Balance panels without exceeding the readable capacity, including single notes.
export function sectionBoardNotes<T>(notes:T[],capacity=4):T[][]{
 const limit=Math.min(20,Math.max(1,Math.floor(capacity)||1));
 const count=Math.ceil(notes.length/limit),sections:T[][]=[];
 let offset=0;
 for(let index=0;index<count;index++){
  const size=Math.ceil((notes.length-offset)/(count-index));
  sections.push(notes.slice(offset,offset+size));offset+=size;
 }
 return sections;
}

export function sectionMeasuredBoardNotes<T>(notes:T[],capacity:number,width:number,height:number,identify:(note:T)=>string,measure:(note:T)=>number,greeting?:BoardReservedArea):T[][]{
 const limit=Math.max(1,Math.floor(capacity)||1);
 const ids=notes.map(identify),sizes=notes.map(measure);
 // Consider the remaining notes too: filling each panel greedily strands tails.
 // Prefer fewer panels, then fewer singletons, then evenly populated panels.
 const choices:Array<{panels:number;singletons:number;imbalance:number;size:number}>=[];
 choices[notes.length]={panels:0,singletons:0,imbalance:0,size:0};
 for(let start=notes.length-1;start>=0;start--){
  for(let size=1;size<=Math.min(limit,notes.length-start);size++){
   if(size>1){
    const layout=layoutBoardPanel(ids.slice(start,start+size),width,height,sizes.slice(start,start+size),greeting);
    if(layout.width>width||layout.height>height)continue;
   }
   // An oversized note can always occupy its own expanded panel.
   const rest=choices[start+size];
   const candidate={panels:rest.panels+1,singletons:rest.singletons+(size===1?1:0),imbalance:rest.imbalance+size*size,size};
   const best=choices[start];
   if(!best||candidate.panels<best.panels||candidate.panels===best.panels&&(candidate.singletons<best.singletons||candidate.singletons===best.singletons&&(candidate.imbalance<best.imbalance||candidate.imbalance===best.imbalance&&size>best.size)))choices[start]=candidate;
  }
 }
 const panels:T[][]=[];
 for(let start=0;start<notes.length;){
  const size=choices[start].size;
  panels.push(notes.slice(start,start+size));start+=size;
 }
 return panels;
}

// Fit equal papers into differently sized regions without giving each region
// the same number of notes. This lets the full-width top and bottom do their share.
function fitBoardRegions(count:number,regions:BoardReservedArea[]){
 const gap=12,zones=regions.filter(zone=>zone.width>0&&zone.height>0),needed=Math.max(1,count);
 const grid=(zone:BoardReservedArea,footprint:number)=>({columns:Math.max(0,Math.floor((zone.width+gap)/(footprint+gap))),rows:Math.max(0,Math.floor((zone.height+gap)/(footprint+gap)))});
 let low=0,high=Math.max(0,...zones.map(zone=>Math.min(zone.width,zone.height)));
 for(let step=0;step<32;step++){
  const footprint=(low+high)/2;
  const available=zones.reduce((total,zone)=>{const {columns,rows}=grid(zone,footprint);return total+columns*rows},0);
  if(available>=needed)low=footprint;else high=footprint;
 }
 const grids=zones.map(zone=>({...grid(zone,low),used:0})),cells:BoardReservedArea[]=[];
 while(cells.length<count){
  const before=cells.length;
  for(let index=0;index<zones.length&&cells.length<count;index++){
   const zone=zones[index],grid=grids[index];
   if(grid.used>=grid.columns*grid.rows)continue;
   const width=(zone.width-gap*(grid.columns-1))/grid.columns,height=(zone.height-gap*(grid.rows-1))/grid.rows;
   const slot=grid.used++;
   cells.push({x:zone.x+(slot%grid.columns)*(width+gap),y:zone.y+Math.floor(slot/grid.columns)*(height+gap),width,height});
  }
  if(cells.length===before)break;
 }
 return {maxSize:Math.max(1,(low-28)/1.4),cells};
}

function panelMetrics(count:number,width:number,height:number,greeting?:BoardReservedArea){
 const padding=8,gap=12;
 const sideGreeting=Boolean(greeting&&width>=760);
 // Keep a safe fit for smaller screens, and compare both ways of dividing the
 // complete board around the title on large screens.
 const zones:BoardReservedArea[]=greeting?(sideGreeting?[
  {x:padding,y:padding,width:greeting.x-gap-padding,height:height-padding*2},
  {x:greeting.x+greeting.width+gap,y:padding,width:width-greeting.x-greeting.width-gap-padding,height:height-padding*2},
 ]:[
  {x:padding,y:padding,width:width-padding*2,height:greeting.y-gap-padding},
  {x:padding,y:greeting.y+greeting.height+gap,width:width-padding*2,height:height-greeting.y-greeting.height-gap-padding},
 ]):[{x:padding,y:padding,width:width-padding*2,height:height-padding*2}];
 const slots=Math.max(1,Math.ceil(count/zones.length));
 const laneWidth=Math.max(1,Math.min(...zones.map(zone=>zone.width))),laneHeight=Math.max(1,Math.min(...zones.map(zone=>zone.height)));
 let columns=1,rows=slots,bestFit=0;
 for(let candidate=1;candidate<=slots;candidate++){
  const candidateRows=Math.ceil(slots/candidate);
  const fit=Math.min((laneWidth-gap*(candidate-1))/candidate,(laneHeight-gap*(candidateRows-1))/candidateRows);
  if(fit>bestFit){bestFit=fit;columns=candidate;rows=candidateRows}
 }
 const cellWidth=Math.max(1,(laneWidth-gap*(columns-1))/columns),cellHeight=Math.max(1,(laneHeight-gap*(rows-1))/rows);
 const maxSize=Math.max(1,(Math.min(cellWidth,cellHeight)-padding*2-12)/1.4);
 const cells=Array.from({length:count},(_,index)=>{
  const zone=zones[index%zones.length],slot=Math.floor(index/zones.length);
  return {x:zone.x+(slot%columns)*(cellWidth+gap),y:zone.y+Math.floor(slot/columns)*(cellHeight+gap),width:cellWidth,height:cellHeight};
 });
 if(greeting&&sideGreeting&&boardPanelDensity(width,height).limit===20){
  const fullBoard=fitBoardRegions(count,[
   {x:padding,y:padding,width:width-padding*2,height:greeting.y-gap-padding},
   {x:padding,y:greeting.y+greeting.height+gap,width:width-padding*2,height:height-greeting.y-greeting.height-gap-padding},
   {x:padding,y:greeting.y,width:greeting.x-gap-padding,height:greeting.height},
   {x:greeting.x+greeting.width+gap,y:greeting.y,width:width-greeting.x-greeting.width-gap-padding,height:greeting.height},
  ]);
  if(fullBoard.maxSize>maxSize&&fullBoard.cells.length===count)return fullBoard;
 }
 return {cells,maxSize};
}

// Start from a safe fit, then move papers through free horizontal and vertical
// gaps. Dense panels can loosen up without relying on lucky random packing.
function loosenBoardPositions(positions:BoardNotePosition[],sizes:number[],width:number,height:number,reserved:BoardReservedArea|undefined,random:()=>number){
 const padding=8,gap=12;
 const boxes=positions.map(({left,top},index)=>{
  const footprint=sizes[index]*1.4+12,inset=(footprint-sizes[index])/2;
  return {x:left-inset,y:top-inset,width:footprint,height:footprint};
 });
 for(let pass=0;pass<24;pass++)for(let offset=0;offset<boxes.length;offset++){
  const index=(offset+pass)%boxes.length,box=boxes[index];
  // Move between open pockets too, so a paper need not slide past a neighbor
  // to leave its original row or reach space on another side of the title.
  for(let attempt=0;attempt<16;attempt++){
   const x=padding+random()*Math.max(0,width-padding*2-box.width),y=padding+random()*Math.max(0,height-padding*2-box.height);
   if([...boxes.filter((_,otherIndex)=>otherIndex!==index),...(reserved?[reserved]:[])].every(other=>x>=other.x+other.width+gap||other.x>=x+box.width+gap||y>=other.y+other.height+gap||other.y>=y+box.height+gap)){
    box.x=x;box.y=y;break;
   }
  }
  for(const horizontal of [pass%2===0,pass%2!==0]){
   const axis=horizontal?'x':'y',cross=horizontal?'y':'x',length=horizontal?'width':'height',breadth=horizontal?'height':'width';
   let ranges=[[padding,(horizontal?width:height)-padding-box[length]]];
   for(const other of [...boxes.filter((_,otherIndex)=>otherIndex!==index),...(reserved?[reserved]:[])]){
    if(box[cross]>=other[cross]+other[breadth]+gap||other[cross]>=box[cross]+box[breadth]+gap)continue;
    const start=other[axis]-box[length]-gap,end=other[axis]+other[length]+gap;
    ranges=ranges.flatMap(([low,high])=>end<=low||start>=high?[[low,high]]:[...(start>low?[[low,Math.min(high,start)]]:[]),...(end<high?[[Math.max(low,end),high]]:[])]);
   }
   const space=ranges.reduce((total,[low,high])=>total+Math.max(0,high-low),0);
   if(space<=0)continue;
   let choice=random()*space;
   for(const [low,high] of ranges){
    if(choice<=high-low){box[axis]=low+choice;break}
    choice-=high-low;
   }
  }
 }
 return positions.map((position,index)=>({...position,left:boxes[index].x+(boxes[index].width-sizes[index])/2,top:boxes[index].y+(boxes[index].height-sizes[index])/2}));
}

export function layoutBoardPanel(ids:string[],width:number,height:number,noteSizes:number[]=[],greeting?:BoardReservedArea,viewportSize=boardNoteViewportSize(width,height),proportional=false):{size:number;sizes:number[];width:number;height:number;positions:BoardNotePosition[]}{
 // Small screens use large, readable papers below a compact heading. Short
 // landscape screens scroll vertically rather than shrinking the writing.
 if(proportional&&width<1100&&ids.length>0&&ids.length<=3){
  const padding=8,gap=24,columns=width<760?1:Math.min(2,ids.length),rows=Math.ceil(ids.length/columns);
  const target=boardPanelNoteSize(columns,width,height,greeting);
  const sizes=ids.map((_,index)=>Math.min(target,noteSizes[index]||target));
  const footprints=sizes.map(size=>size*1.25+12),start=Math.max(padding,greeting?greeting.y+greeting.height+gap:padding);
  const rowHeight=Math.max(...footprints)+gap;
  const boardHeight=Math.max(height,start+rows*rowHeight-gap+padding);
  const laneWidth=(width-padding*2)/columns;
  const extra=(boardHeight-start-padding-(rows*rowHeight-gap))/2;
  const positions=ids.map((id,index)=>({left:padding+laneWidth*(index%columns+.5)-sizes[index]/2,top:start+extra+Math.floor(index/columns)*rowHeight+(Math.max(...footprints)-sizes[index])/2,rotation:boardNoteRotation(id)}));
  return {size:target,sizes,width,height:boardHeight,positions};
 }
 const padding=8,gap=12,sideGreeting=Boolean(greeting&&width>=760);
 const {cells,maxSize}=panelMetrics(ids.length,width,height,greeting);
 const size=Math.min(viewportSize,maxSize);
 const minimum=Math.min(readableBoardNoteSize(width),maxSize);
 let seed=2166136261;
 for(const id of ids)for(const char of id)seed=Math.imul(seed^char.charCodeAt(0),16777619)>>>0;
 const random=()=>{
  seed=(seed+0x6d2b79f5)>>>0;
  let value=Math.imul(seed^(seed>>>15),1|seed);
  value^=value+Math.imul(value^(value>>>7),61|value);
  return ((value^(value>>>14))>>>0)/4294967296;
 };
 const sizes=ids.map((_,index)=>proportional?Math.max(1,noteSizes[index]||size):Math.max(minimum,size*(.92+random()*.08),noteSizes[index]||0));
 // Place the hardest-to-fit notes first, preserving their original render order.
 const placementOrder=sizes.map((_,index)=>index).sort((a,b)=>sizes[b]-sizes[a]);
 // A roomy fallback guarantees every note fits even on a very small screen.
 const slots=ids.map((_,index)=>index);
 for(let index=slots.length-1;index>0;index--){const other=Math.floor(random()*(index+1));[slots[index],slots[other]]=[slots[other],slots[index]]}
 const fallback=ids.map((_,index)=>{
  const x=random(),y=random();
  const cell=cells[slots[index]],noteSize=sizes[index],footprint=noteSize*1.4+12;
  return {left:cell.x+(cell.width-footprint)*x+(footprint-noteSize)/2,top:cell.y+(cell.height-footprint)*y+(footprint-noteSize)/2,rotation:boardNoteRotation(ids[index])};
 });
 // Reserve only the title itself; notes can use the space above and below it.
 const reserved=greeting;
 const separate=(box:BoardReservedArea,other:BoardReservedArea)=>box.x>=other.x+other.width+gap||other.x>=box.x+box.width+gap||box.y>=other.y+other.height+gap||other.y>=box.y+box.height+gap;
 // Retry the whole arrangement so an unlucky early placement never forces overlap.
 for(let attempt=0;attempt<12;attempt++){
  const boxes:BoardReservedArea[]=reserved?[reserved]:[],positions:BoardNotePosition[]=[];
  let placedCount=0;
  for(const index of placementOrder){
   const noteSize=sizes[index];
   const footprint=noteSize*1.4+12;
   if(footprint>width-padding*2||footprint>height-padding*2)break;
   let placed=false;
   for(let candidate=0;candidate<150;candidate++){
    const box={x:padding+random()*Math.max(0,width-padding*2-footprint),y:padding+random()*Math.max(0,height-padding*2-footprint),width:footprint,height:footprint};
    if(!boxes.every(other=>separate(box,other)))continue;
    boxes.push(box);
    positions[index]={left:box.x+(footprint-noteSize)/2,top:box.y+(footprint-noteSize)/2,rotation:boardNoteRotation(ids[index])};
    placedCount++;
    placed=true;break;
   }
   if(!placed)break;
  }
  if(placedCount===ids.length)return {size,sizes,width,height,positions};
 }
 if(sizes.every(noteSize=>noteSize<=maxSize))return {size,sizes,width,height,positions:loosenBoardPositions(fallback,sizes,width,height,reserved,random)};
 // Share any necessary reduction across all notes. Capping each note separately
 // wastes space on short messages and makes detailed messages harder to read.
 if(proportional)return layoutBoardPanel(ids,width,height,sizes.map(noteSize=>noteSize*.94),greeting,viewportSize,true);
 // A note that genuinely exceeds the available space still uses the scattered
 // placement algorithm. Ordinary content growth never replaces it with columns.
 const largest=Math.max(...sizes),footprint=largest*1.4+12;
 let boardWidth=Math.max(width,greeting?footprint*2+greeting.width+gap*4+padding*4:footprint+padding*4);
 let boardHeight=Math.max(height,(footprint+gap)*Math.max(1,Math.ceil(ids.length/(greeting?2:1)))+padding*4+(greeting&&!sideGreeting?greeting.height+gap*2:0));
 // A mixed-size grid can still need more room than the largest-note estimate.
 if(boardWidth<=width&&boardHeight<=height){boardWidth=Math.ceil(width*1.1);boardHeight=Math.ceil(height*1.1)}
 const expandedGreeting=greeting?{...greeting,x:(boardWidth-greeting.width)/2}:undefined;
 return layoutBoardPanel(ids,boardWidth,boardHeight,sizes,expandedGreeting,viewportSize);
}

// Reserve space for the whole rotated note, including tape, stickers and shadow.
export function scatterBoardNotes(ids:string[],width:number,minHeight:number,noteSizes:number[]=[],reservedAreas:BoardReservedArea[]=[]){
 // Follow both dimensions of the visible board, including short landscape screens.
 const size=Math.max(1,Math.min(240,Math.max(120,width*.17),minHeight>0?Math.max(80,minHeight*.32):240,(width-36)/2/1.3));
 const maxSize=Math.max(size,Math.min((width-28)/1.3,size*1.8,minHeight>0?Math.max(size,minHeight*.72):Infinity));
 const sizes=ids.map((_,index)=>Math.min(maxSize,Math.max(size,noteSizes[index]||0)));
 const footprints=sizes.map(noteSize=>noteSize*1.3+12),gap=10,padding=8;
 const boardWidth=Math.max(width,...footprints.map(footprint=>footprint+padding*2));
 const positions:BoardNotePosition[]=[];
 if(!ids.length)return {size,sizes,width:boardWidth,height:reservedAreas.length?minHeight:0,positions};
 const usableWidth=boardWidth-padding*2;
 let height=Math.max(minHeight,...footprints.map(footprint=>footprint+padding*2),footprints.reduce((area,footprint)=>area+(footprint+gap)**2,0)/usableWidth/.68);
 let seed=2166136261;
 for(const id of ids)for(const char of id)seed=Math.imul(seed^char.charCodeAt(0),16777619)>>>0;
 const random=()=>{
  seed=(seed+0x6d2b79f5)>>>0;
  let value=Math.imul(seed^(seed>>>15),1|seed);
  value^=value+Math.imul(value^(value>>>7),61|value);
  return ((value^(value>>>14))>>>0)/4294967296;
 };
 const boxes:BoardReservedArea[]=[...reservedAreas];
 for(let index=0;index<ids.length;index++){
  const footprint=footprints[index],noteSize=sizes[index];
  const rotation=boardNoteRotation(ids[index]);
  let box:{x:number;y:number}|undefined;
  for(let attempt=0;attempt<250;attempt++){
   const candidate={x:padding+random()*Math.max(0,boardWidth-padding*2-footprint),y:padding+random()*Math.max(0,height-padding*2-footprint)};
   if(boxes.every(other=>candidate.x>=other.x+other.width+gap||other.x>=candidate.x+footprint+gap||candidate.y>=other.y+other.height+gap||other.y>=candidate.y+footprint+gap)){
    box=candidate;break;
   }
  }
  // Crowded boards grow vertically instead of ever accepting a collision.
  if(!box){
   box={x:padding+random()*Math.max(0,boardWidth-padding*2-footprint),y:Math.max(padding,...boxes.map(other=>other.y+other.height+gap))};
   height=Math.max(height,box.y+footprint+padding);
  }
  boxes.push({...box,width:footprint,height:footprint});
  positions.push({left:box.x+(footprint-noteSize)/2,top:box.y+(footprint-noteSize)/2,rotation});
 }
 return {size,sizes,width:boardWidth,height:Math.ceil(height),positions};
}
