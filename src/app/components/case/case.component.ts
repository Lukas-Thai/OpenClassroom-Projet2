import { Component, Input } from '@angular/core';

@Component({
  selector: 'case-component',
  standalone:true,
  templateUrl: './case.component.html',
  styleUrls: ['./case.component.scss']
})
export class CaseComponent {
  @Input() label: string = '';
  @Input() value: number = 0;
}