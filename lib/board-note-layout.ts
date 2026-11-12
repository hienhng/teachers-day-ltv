export type BoardNotePosition = {left:number;top:number;rotation:number};
export type BoardReservedArea = {x:number;y:number;width:number;height:number};

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
 const reserved=greeting??{x:width>=760?(width-Math.min(360,width*.32))/2:16,y:(height-(width>=760?240:120))/2,width:width>=760?Math.min(360,width*.32):width-32,height:width>=760?240:120};
 for(let count=5;count>=3;count--)if(panelMetrics(count,width,height,reserved).maxSize>=readableBoardNoteSize(width))return count;
 return 3;
}

export function readableBoardNoteSize(width:number){return width>=760?200:160}

// Follow the visible board in both orientations rather than a fixed pixel cap.
export function boardNoteViewportSize(width:number,height:number){
 return Math.max(1,Math.min(width*(width>=760?.24:.6),height*.42));
}

// Use the busiest panel's available space for one paper size across the board.
export function boardPanelNoteSize(count:number,width:number,height:number,greeting?:BoardReservedArea){
 return Math.min(boardNoteViewportSize(width,height),panelMetrics(count,width,height,greeting).maxSize);
}

// Keep at least three notes together, merging short tails into balanced panels.
export function sectionBoardNotes<T>(notes:T[],capacity=4):T[][]{
 const limit=Math.min(5,Math.max(3,Math.floor(capacity)||3));
 const count=Math.min(Math.ceil(notes.length/limit),Math.max(1,Math.floor(notes.length/3))),sections:T[][]=[];
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

function panelMetrics(count:number,width:number,height:number,greeting?:BoardReservedArea){
 const padding=8,gap=12;
 const sideGreeting=Boolean(greeting&&width>=760);
 // Split the space around the title into lanes and choose a grid that fits the
 // current count. It supplies a safe size and fallback for random placement.
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
 return {zones,columns,cellWidth,cellHeight,maxSize};
}

export function layoutBoardPanel(ids:string[],width:number,height:number,noteSizes:number[]=[],greeting?:BoardReservedArea,viewportSize=boardNoteViewportSize(width,height),proportional=false):{size:number;sizes:number[];width:number;height:number;positions:BoardNotePosition[]}{
 const padding=8,gap=12,sideGreeting=Boolean(greeting&&width>=760);
 const {zones,columns,cellWidth,cellHeight,maxSize}=panelMetrics(ids.length,width,height,greeting);
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
 const fallback=ids.map((_,index)=>{
  const x=random(),y=random();
  const zone=zones[index%zones.length],slot=Math.floor(index/zones.length);
  const column=slot%columns,row=Math.floor(slot/columns),noteSize=sizes[index],footprint=noteSize*1.4+12;
  const left=zone.x+column*(cellWidth+gap),top=zone.y+row*(cellHeight+gap);
  return {left:left+(cellWidth-footprint)*x+(footprint-noteSize)/2,top:top+(cellHeight-footprint)*y+(footprint-noteSize)/2,rotation:boardNoteRotation(ids[index])};
 });
 // Keep the desktop title's entire vertical lane clear during scrolling too.
 const reserved=greeting?(sideGreeting?{x:greeting.x,y:0,width:greeting.width,height}:greeting):undefined;
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
 if(sizes.every(noteSize=>noteSize<=maxSize))return {size,sizes,width,height,positions:fallback};
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
