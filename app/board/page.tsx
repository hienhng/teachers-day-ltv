import type {Metadata} from 'next';
import Petals from '../petals';

export const metadata:Metadata={
 title:'Bảng tri ân — Trạm phát sóng yêu thương',
};

export default function BoardPage(){
 return <Petals initialView="garden"/>;
}
