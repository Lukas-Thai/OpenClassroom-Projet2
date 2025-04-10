import { Component, NgModule, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { filter, Observable, Subject, takeUntil } from 'rxjs';
import { OlympicService } from 'src/app/core/services/olympic.service';
import { Olympic } from '../../core/models/Olympic';
import { Participation } from '../../core/models/Participation';
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { HomeComponent } from '../home/home.component';
import Chart, { ChartConfiguration, ChartItem } from 'chart.js/auto';
import { CaseComponent } from 'src/app/components/case/case.component';

@Component({
  selector: 'app-country-detail',
  standalone: true,
  imports: [RouterModule, CaseComponent],
  templateUrl: './country-detail.component.html',
  styleUrl: './country-detail.component.scss'
})

export class CountryDetailComponent implements OnInit{
  private countryId!: number;
  public olympics$ !: Observable<Olympic | null | undefined>;
  private destroy$ = new Subject<void>();
  private rawData : Array<Olympic> = []; 
  public countryName:string = "Fetching...";
  public nbEntry:number = 0;
  public nbMedal:number = 0;
  public nbAthlete:number = 0;
  chart !:Chart;
  chartConfig!: ChartConfiguration;
  constructor(private olympicService: OlympicService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Récupère l'id du pays
    this.route.paramMap.subscribe((params) => {
      const paramId :string | null = params.get('id');
      try{
        if(!paramId){//pas d'id
          throw new Error();
        }
        this.countryId = parseInt(paramId as string);
      }
      catch(e){
        this.countryName = "Error : No Id Provided";
      }
    });

    this.olympics$ = this.olympicService.getOlympics();
      this.olympicService.loadInitialData();
      this.olympics$.pipe(
        filter(data => data != null), 
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data: Olympic | null | undefined) => {
          this.addToRawData(data as Olympic);
          this.updateGraph();
        },
        error: (err) => {
          console.error('Erreur lors de la récupération des données :', err);
        },
        complete: () => {
        }
      });
  }
  updateGraph(){
    if(this.rawData.length > 0){
      this.chartConfig = {type : "line",
        data : {labels : this.rawData[0].participations.map((item: Participation) => item.year),
        datasets: [{label: "Medals gained", data:this.rawData[0].participations.map((item: Participation) => item.medalsCount)}]
      },
      options:{
        responsive: true,
        maintainAspectRatio: false ,
        scales: {
          x: {
            title: {
              display: true,
              text: "Dates", 
              font: {
                size: 25,
              },
              color: "gray" 
            }
          },
          y: { 
            beginAtZero: true
          }
        }
      }}
      if(this.chart){
        this.chart.destroy();
      }
      this.chart = new Chart(document.getElementById('graph') as ChartItem,this.chartConfig);//on refait un nouveau graphe
    }

  }
  addToRawData(newData: Olympic[] | Olympic) {
    const arrayData: Olympic[] = Array.isArray(newData) ? newData : [newData]; //conversion des données en une liste
    arrayData.forEach((data:Olympic) => {
      if(data.id === this.countryId){//on ignore tout les pays qui correspondent pas à l'id recherché
        if(this.rawData.length === 0){
          this.rawData.push(data);
          this.countryName = this.rawData[0].country;
        }
        else{
          for(let participation of data.participations){
            const participationExists = this.rawData[0].participations.some(
              (item: Participation) => item.id === participation.id
            );
            if (!participationExists) {//la participation n'existe pas on l'ajoute
              this.rawData[0].participations.push(participation);
            }
          }
        }
        this.nbEntry = this.rawData[0].participations.length;
        this.nbMedal = this.rawData[0].participations.reduce((sum, p) => sum + p.medalsCount, 0);
        this.nbAthlete = this.rawData[0].participations.reduce((sum, p) => sum + p.athleteCount, 0);
      }
    });
    if(this.rawData.length === 0){
      this.countryName = "No Data";
    }
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
