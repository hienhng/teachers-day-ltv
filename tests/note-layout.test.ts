import {describe,it,expect} from 'vitest';
import {noteShapes,noteContentInsets,noteStickerSize} from '../lib/note-design';
import {boardPanelNoteSize,boardNoteViewportSize,boardPanelCapacity,scatterBoardNotes,sectionBoardNotes,sectionMeasuredBoardNotes,layoutBoardPanel} from '../lib/board-note-layout';

describe('sectioned board panels',()=>{
 it('gives identical-shaped notes individual gentle tilts independent of sizing and panel order',()=>{
  const ids=Array.from({length:12},(_,index)=>`same-shape-${index}`);
  const original=layoutBoardPanel(ids,1440,900,ids.map(()=>200));
  const rotations=new Map(ids.map((id,index)=>[id,original.positions[index].rotation]));
  expect(new Set(rotations.values()).size).toBe(ids.length);
  expect([...rotations.values()].some(angle=>angle<0)).toBe(true);
  expect([...rotations.values()].some(angle=>angle>0)).toBe(true);
  rotations.forEach(angle=>expect(Math.abs(angle)).toBeLessThanOrEqual(5));
  const reordered=[...ids].reverse();
  const resized=layoutBoardPanel(reordered,390,700,reordered.map((_,index)=>index%2?300:160),undefined,undefined,true);
  reordered.forEach((id,index)=>expect(resized.positions[index].rotation).toBe(rotations.get(id)));
  const scattered=scatterBoardNotes(ids,850,600);
  ids.forEach((id,index)=>expect(scattered.positions[index].rotation).toBe(rotations.get(id)));
 });
 it('keeps paper sizes equal across panels with different numbers of notes',()=>{
  for(const [width,height] of [[320,500],[390,700],[850,600],[1440,900],[2560,1440]]){
   const greeting={x:width>=760?width*.35:16,y:height/2-60,width:width>=760?width*.3:width-32,height:120};
   const size=boardPanelNoteSize(8,width,height,greeting);
   for(const count of [1,3,4,5,6,7,8]){
    const ids=Array.from({length:count},(_,index)=>`equal-${index}`);
    const layout=layoutBoardPanel(ids,width,height,ids.map(()=>size),greeting,undefined,true);
    expect(layout.sizes).toEqual(ids.map(()=>size));
    expect(layout.width).toBe(width);expect(layout.height).toBe(height);
   }
  }
 });
 it('keeps detailed notes larger while fitting mixed sizes around the greeting',()=>{
  const ids=['short','long','medium','tiny'],requested=[180,580,300,150];
  for(const [width,height] of [[320,500],[390,700],[740,320],[850,600],[1440,720],[1920,900]]){
   for(const withGreeting of [false,true]){
    const greeting=withGreeting?{x:width>=760?width*.35:16,y:height/2-60,width:width>=760?width*.3:width-32,height:120}:undefined;
    const layout=layoutBoardPanel(ids,width,height,requested,greeting,undefined,true);
    expect(layout.width).toBe(width);expect(layout.height).toBe(height);
    expect(layout.sizes[1]).toBeGreaterThan(layout.sizes[2]);
    expect(layout.sizes[2]).toBeGreaterThan(layout.sizes[0]);
    expect(layout.sizes[0]).toBeGreaterThan(layout.sizes[3]);
    const scale=layout.sizes[1]/requested[1];
    layout.sizes.forEach((size,index)=>expect(size/requested[index]).toBeCloseTo(scale));
    const boxes=layout.positions.map(({left,top},index)=>{
     const size=layout.sizes[index],footprint=size*1.4+12;
     return {x:left-(footprint-size)/2,y:top-(footprint-size)/2,width:footprint,height:footprint};
    });
    boxes.forEach((box,index)=>{
     expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);
     expect(box.x+box.width).toBeLessThanOrEqual(width);expect(box.y+box.height).toBeLessThanOrEqual(height);
     for(const other of [...boxes.slice(index+1),...(greeting?[greeting]:[])])expect(box.x+box.width<=other.x||other.x+other.width<=box.x||box.y+box.height<=other.y||other.y+other.height<=box.y).toBe(true);
    });
    expect(layoutBoardPanel(ids,width,height,requested,greeting,undefined,true)).toEqual(layout);
   }
  }
 });
 it('sizes notes with the visible screen width and height instead of a fixed cap',()=>{
  const phone=boardNoteViewportSize(390,700);
  const desktop=boardNoteViewportSize(1440,900);
  const large=boardNoteViewportSize(2560,1440);
  expect(phone).toBeLessThan(desktop);
  expect(desktop).toBeLessThan(large);
  expect(boardNoteViewportSize(1440,320)).toBeLessThan(desktop);
  const smallLayout=layoutBoardPanel(['adaptive'],1440,900);
  const largeLayout=layoutBoardPanel(['adaptive'],2560,1440);
  expect(largeLayout.sizes[0]).toBeGreaterThan(smallLayout.sizes[0]);
  expect(largeLayout.sizes[0]).toBeGreaterThan(280);
 });
 it('balances measured desktop panels instead of stranding a single leftover note',()=>{
  const greeting={x:1100,y:600,width:360,height:240};
  const notes=Array.from({length:17},(_,index)=>`balanced-${index}`);
  const panels=sectionMeasuredBoardNotes(notes,16,2560,1440,id=>id,()=>240,greeting);
  expect(panels.map(panel=>panel.length)).toEqual([9,8]);
  expect(panels.flat()).toEqual(notes);
  panels.forEach(panel=>expect(layoutBoardPanel(panel,2560,1440,panel.map(()=>240),greeting)).toMatchObject({width:2560,height:1440}));
 });
 it('keeps unavoidable oversized singletons without stranding ordinary notes',()=>{
  const notes=Array.from({length:10},(_,index)=>({id:`oversized-${index}`,size:index===4?1200:220}));
  const greeting={x:780,y:330,width:360,height:240};
  const panels=sectionMeasuredBoardNotes(notes,8,1920,900,note=>note.id,note=>note.size,greeting);
  expect(panels.map(panel=>panel.length)).toEqual([4,1,5]);
  expect(panels.flat()).toEqual(notes);
  expect(sectionMeasuredBoardNotes([],8,1920,900,String,()=>220,greeting)).toEqual([]);
 });
 it('uses larger displays for more readable scattered notes per panel',()=>{
  const small=boardPanelCapacity(1328,750),large=boardPanelCapacity(2560,1440);
  expect(large).toBeGreaterThan(small);expect(large).toBe(8);
  const greeting={x:1100,y:600,width:360,height:240};
  const ids=Array.from({length:large},(_,index)=>`large-${index}`);
  const panels=sectionMeasuredBoardNotes(ids,large,2560,1440,id=>id,()=>200,greeting);
  expect(panels[0].length).toBe(8);
  const layout=layoutBoardPanel(panels[0],2560,1440,panels[0].map(()=>200),greeting);
  expect(layout.width).toBe(2560);expect(layout.height).toBe(1440);
  expect(new Set(layout.positions.map(position=>position.top)).size).toBe(panels[0].length);
 });
 it('adds panels for long messages while keeping short-message panels populated',()=>{
  const notes=Array.from({length:20},(_,index)=>({id:`mixed-${index}`,size:index===8?420:220}));
  const greeting={x:780,y:330,width:360,height:240};
  const panels=sectionMeasuredBoardNotes(notes,8,1920,900,note=>note.id,note=>note.size,greeting);
  expect(panels.flat()).toEqual(notes);
  expect(panels.length).toBeGreaterThan(1);
  expect(panels.some(panel=>panel.length>=4)).toBe(true);
  panels.forEach(panel=>{
   const layout=layoutBoardPanel(panel.map(note=>note.id),1920,900,panel.map(note=>note.size),greeting);
   expect(layout.width).toBe(1920);expect(layout.height).toBe(900);
   panel.forEach((note,index)=>expect(layout.sizes[index]).toBeGreaterThanOrEqual(note.size));
  });
 });
 it('adapts capacity to board width and height and balances larger panels',()=>{
  expect(boardPanelCapacity(1920,900)).toBe(8);
  expect(boardPanelCapacity(1328,750)).toBe(4);
  expect(boardPanelCapacity(1170,550)).toBe(3);
  expect(boardPanelCapacity(850,600)).toBe(3);
  expect(boardPanelCapacity(350,700)).toBe(3);
  expect(boardPanelCapacity(1328,320)).toBe(3);
  const notes=Array.from({length:30},(_,index)=>index);
  expect(sectionBoardNotes(notes,8).map(panel=>panel.length)).toEqual([8,8,7,7]);
  for(const capacity of [3,4,5,6,7,8,12]){
   const panels=sectionBoardNotes(notes,capacity);
   expect(panels.flat()).toEqual(notes);
   panels.forEach(panel=>expect(panel.length).toBeLessThanOrEqual(Math.min(capacity,8)));
  }
 });
 it('keeps at least three notes per panel and scales them to the available space',()=>{
  for(const [width,height] of [[350,700],[1328,750],[1170,550],[1920,900]]){
   const greeting={x:width>=760?(width-360)/2:16,y:(height-120)/2,width:width>=760?360:width-32,height:120};
   const capacity=boardPanelCapacity(width,height,greeting);
   expect(capacity).toBeGreaterThanOrEqual(3);
   expect(capacity).toBeLessThanOrEqual(8);
   for(let count=0;count<=30;count++){
    const notes=Array.from({length:count},(_,index)=>`adaptive-${index}`);
    const panels=sectionBoardNotes(notes,capacity);
    expect(panels.flat()).toEqual(notes);
    panels.forEach(panel=>{
     expect(panel.length).toBeGreaterThanOrEqual(Math.min(3,count));
     expect(panel.length).toBeLessThanOrEqual(8);
     const base=layoutBoardPanel(panel,width,height,[],greeting);
     const fitted=layoutBoardPanel(panel,width,height,panel.map(()=>Math.min(1200,base.size)),greeting);
     expect(fitted.width).toBe(width);expect(fitted.height).toBe(height);
    });
   }
  }
  expect(sectionBoardNotes(['a','b','c','d','e'],3).map(panel=>panel.length)).toEqual([5]);
  expect(sectionBoardNotes(['a','b','c','d','e','f','g'],3).map(panel=>panel.length)).toEqual([4,3]);
 });
 it('balances notes into panels of three or four whenever possible without reordering',()=>{
  for(let count=0;count<=60;count++){
   const notes=Array.from({length:count},(_,index)=>index),panels=sectionBoardNotes(notes);
   expect(panels.flat()).toEqual(notes);
   panels.forEach(panel=>{expect(panel.length).toBeLessThanOrEqual(count===5?5:4);expect(panel.length).toBeGreaterThanOrEqual(Math.min(count,3))});
  }
  expect(sectionBoardNotes(Array.from({length:10})).map(panel=>panel.length)).toEqual([4,3,3]);
 });
 it('fits adaptive panels inside one viewport and clear of the title and other notes',()=>{
  for(const [width,height] of [[220,360],[320,500],[390,700],[740,320],[850,600],[1440,720],[1920,900]]){
   for(const showGreeting of [false,true])for(const count of [3,4,6,8])for(let seed=0;seed<12;seed++){
    const greeting=showGreeting?{x:width>=760?width*.28:16,y:height/2-80,width:width>=760?width*.44:width-32,height:160}:undefined;
    const layout=layoutBoardPanel(Array.from({length:count},(_,index)=>`${seed}-${index}`),width,height,[],greeting);
    const boxes=layout.positions.map(({left,top},index)=>{
     const size=layout.sizes[index],footprint=size*1.4+12;
     return {x:left-(footprint-size)/2,y:top-(footprint-size)/2,width:footprint,height:footprint};
    });
    for(const [index,box] of boxes.entries()){
     expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);
     expect(box.x+box.width).toBeLessThanOrEqual(width);expect(box.y+box.height).toBeLessThanOrEqual(height);
     for(const other of [...boxes.slice(index+1),...(greeting?[greeting]:[])])expect(box.x+box.width<=other.x||other.x+other.width<=box.x||box.y+box.height<=other.y||other.y+other.height<=box.y).toBe(true);
    }
   }
  }
 });
 it('grows panels around complete messages without shrinking measured notes or overlapping',()=>{
  for(const width of [320,850,1440]){
   const measured=[340,680,240,460],greeting={x:80,y:120,width:160,height:120};
   const layout=layoutBoardPanel(['a','b','c','d'],width,500,measured,greeting);
   const boxes=layout.positions.map(({left,top},index)=>{
    const size=layout.sizes[index],footprint=size*1.4+12;
    expect(size).toBeGreaterThanOrEqual(measured[index]);
    return {x:left-(footprint-size)/2,y:top-(footprint-size)/2,width:footprint,height:footprint};
   });
   boxes.forEach((box,index)=>{
    expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);
    const titleLeft=(layout.width-greeting.width)/2,titleRight=titleLeft+greeting.width;
    expect(box.x+box.width<=titleLeft||box.x>=titleRight).toBe(true);
    expect(box.x+box.width).toBeLessThanOrEqual(layout.width);
    expect(box.y+box.height).toBeLessThanOrEqual(layout.height);
    for(const other of boxes.slice(index+1))expect(box.x+box.width<=other.x||other.x+other.width<=box.x||box.y+box.height<=other.y||other.y+other.height<=box.y).toBe(true);
   });
  }
 });
 it('keeps each random arrangement stable and varies placement between panels',()=>{
  const ids=['first','second','third','fourth'],greeting={x:490,y:200,width:460,height:230};
  const layout=layoutBoardPanel(ids,1440,720,[],greeting);
  expect(layoutBoardPanel(ids,1440,720,[],greeting)).toEqual(layout);
  expect(layoutBoardPanel(ids.map(id=>`next-${id}`),1440,720,[],greeting).positions).not.toEqual(layout.positions);
  expect(new Set(layout.positions.map(position=>position.top)).size).toBe(4);
  expect(new Set(layout.sizes).size).toBe(4);
 });
});

describe('scattered board notes',()=>{
 it('keeps tilted notes and their decorations apart and inside the board after resizing',()=>{
  for(const width of [220,280,390,599,600,850,1200,1920])for(const count of [1,10,20,60]){
   const ids=Array.from({length:count},(_,index)=>`note-${index}`);
   const {positions,size,height}=scatterBoardNotes(ids,width,380);
   const boxes=positions.map(({left,top,rotation})=>{
    const radians=rotation*Math.PI/180;
    const radius=size*.58*(Math.abs(Math.cos(radians))+Math.abs(Math.sin(radians)));
    return {left:left+size/2-radius,right:left+size/2+radius,top:top+size/2-radius,bottom:top+size/2+radius};
   });
   for(const [index,box] of boxes.entries()){
    expect(box.left).toBeGreaterThanOrEqual(0);expect(box.right).toBeLessThanOrEqual(width);
    expect(box.top).toBeGreaterThanOrEqual(0);expect(box.bottom).toBeLessThanOrEqual(height);
    for(const other of boxes.slice(index+1))expect(box.right+8<=other.left||other.right+8<=box.left||box.bottom+8<=other.top||other.bottom+8<=box.top).toBe(true);
   }
  }
 });
 it('preserves positions across rerenders and scatters different pages differently',()=>{
  const ids=Array.from({length:20},(_,index)=>`page-one-${index}`);
  const layout=scatterBoardNotes(ids,1200,400);
  expect(scatterBoardNotes(ids,1200,400)).toEqual(layout);
  expect(scatterBoardNotes(ids.map(id=>id.replace('one','two')),1200,400)).not.toEqual(layout);
  expect(new Set(layout.positions.map(position=>position.top)).size).toBe(20);
  expect(new Set(layout.positions.map(position=>position.rotation)).size).toBe(20);
 });
 it('reserves room for larger square notes without overlapping their neighbors',()=>{
  const sizes=[185,420,260,620,185,350];
  for(const width of [280,850,1200]){
   const layout=scatterBoardNotes(sizes.map((_,index)=>`long-note-${index}`),width,400,sizes);
   const boxes=layout.positions.map(({left,top,rotation},index)=>{
    const size=layout.sizes[index],angle=rotation*Math.PI/180;
    const radius=size*.58*(Math.abs(Math.cos(angle))+Math.abs(Math.sin(angle)));
    return {left:left+size/2-radius,right:left+size/2+radius,top:top+size/2-radius,bottom:top+size/2+radius};
   });
   for(const [index,box] of boxes.entries()){
    expect(layout.width).toBe(width);
    expect(box.left).toBeGreaterThanOrEqual(0);expect(box.right).toBeLessThanOrEqual(width);
    expect(box.top).toBeGreaterThanOrEqual(0);expect(box.bottom).toBeLessThanOrEqual(layout.height);
    for(const other of boxes.slice(index+1))expect(box.right+8<=other.left||other.right+8<=box.left||box.bottom+8<=other.top||other.bottom+8<=box.top).toBe(true);
   }
  }
 });
 it('scales notes with board width and height and caps long messages to the viewport',()=>{
  const ids=['short','long'];
  const phone=scatterBoardNotes(ids,320,650,[185,984]);
  const tablet=scatterBoardNotes(ids,850,650,[185,984]);
  const desktop=scatterBoardNotes(ids,1440,900,[185,984]);
  expect(phone.size).toBeLessThan(tablet.size);
  expect(tablet.size).toBeLessThan(desktop.size);
  expect(scatterBoardNotes(ids,850,240).size).toBeLessThan(tablet.size);
  for(const layout of [phone,tablet,desktop]){
   expect(layout.sizes[1]).toBeLessThan(984);
   expect(layout.sizes[1]*1.3+28).toBeLessThanOrEqual(layout.width);
  }
 });
 it('does not reserve space for an empty board',()=>{
  expect(scatterBoardNotes([],390,600)).toMatchObject({height:0,positions:[]});
 });
 it('keeps notes and decorations clear of the centered chalk greeting, including on crowded boards',()=>{
  for(const width of [280,390,850,1200])for(const count of [1,10,20]){
   const greeting={x:width*.2,y:150,width:width*.6,height:230};
   const sizes=Array.from({length:count},(_,index)=>index%3===0?330:185);
   const layout=scatterBoardNotes(sizes.map((_,index)=>`greeting-note-${index}`),width,600,sizes,[greeting]);
   layout.positions.forEach(({left,top},index)=>{
    const size=layout.sizes[index],footprint=size*1.3+12;
    const x=left-(footprint-size)/2,y=top-(footprint-size)/2;
    expect(x>=greeting.x+greeting.width+9||x+footprint+9<=greeting.x||y>=greeting.y+greeting.height+9||y+footprint+9<=greeting.y).toBe(true);
    expect(y+footprint).toBeLessThanOrEqual(layout.height);
   });
  }
  expect(scatterBoardNotes([],390,600,[],[{x:40,y:200,width:310,height:200}])).toMatchObject({height:600,positions:[]});
 });
});

describe('sticker clearance',()=>{
 for(const [theme,shape] of Object.entries(noteShapes)){
  it(`keeps rotated stickers outside the ${shape.shape} writing area at every note size`,()=>{
   for(const width of [120,240,480,984]){
    for(const count of [1,2])for(const gap of [2,4]){
     const insets=noteContentInsets(theme,count,gap);
     const content={left:width*insets.left/100,right:width*(1-insets.right/100),top:width*insets.top/100,bottom:width*(1-insets.bottom/100)};
     expect(content.right-content.left).toBeGreaterThan(width*.4);
     for(const sticker of shape.stickers.slice(0,count)){
      const angle=sticker.rotation*Math.PI/180,half=width*noteStickerSize/200;
      const corners=[[-half,-half],[half,-half],[half,half],[-half,half]].map(([x,y])=>({
       x:width*sticker.x/100+x*Math.cos(angle)-y*Math.sin(angle),
       y:width*sticker.y/100+x*Math.sin(angle)+y*Math.cos(angle),
      }));
      const left=Math.min(...corners.map(point=>point.x)),right=Math.max(...corners.map(point=>point.x));
      const top=Math.min(...corners.map(point=>point.y)),bottom=Math.max(...corners.map(point=>point.y));
      const clearance=width*(gap-.1)/100;
      expect(right+clearance<=content.left||left-clearance>=content.right||bottom+clearance<=content.top||top-clearance>=content.bottom).toBe(true);
     }
    }
   }
  });
  it(`preserves the ${shape.shape} writing area without stickers`,()=>{
   expect(noteContentInsets(theme,0)).toEqual({top:shape.top,bottom:shape.bottom,left:shape.side,right:shape.side});
  });
 }
});
