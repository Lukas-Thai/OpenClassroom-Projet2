// TODO: create here a typescript interface for an olympic country

import { Participation } from "./Participation";

/*
example of an olympic country:
{
    id: 1,
    country: "Italy",
    participations: []
}
*/
export class Olympic{
    id !:number;
    country !:string;
    participations !: Array<Participation>;
}
