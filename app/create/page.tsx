import type {Metadata} from 'next';
import Petals from '../petals';

export const metadata:Metadata={
 title:'Viết lời tri ân — Trạm phát sóng yêu thương',
};

export default function CreatePage(){
 return <Petals initialView="maker"/>;
}
