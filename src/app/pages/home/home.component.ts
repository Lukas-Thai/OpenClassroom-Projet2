import { Component, OnInit } from '@angular/core';
import { filter, Observable, of, Subject, takeUntil } from 'rxjs';
import { OlympicService } from 'src/app/core/services/olympic.service';
import Chart, { ActiveElement, ChartConfiguration, ChartEvent, ChartItem } from 'chart.js/auto';
import { Olympic } from '../../core/models/Olympic';
import { Router } from '@angular/router';
import { Participation } from '../../core/models/Participation';
import { CaseComponent } from 'src/app/components/case/case.component';



@Component({
  selector: 'app-home',
  standalone:true,
  templateUrl: './home.component.html',
  imports: [CaseComponent],
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  public olympics$ !: Observable<Olympic | null | undefined>;
  private destroy$ = new Subject<void>();
  private rawData : Array<Olympic> = []; 
  private pieChart !: Chart;
  public nbJo:number = 0;
  public nbCountry:number = 0;
  chart !:ChartConfiguration;
  constructor(private olympicService: OlympicService, private router: Router) {}

  ngOnInit(): void {
    this.olympics$ = this.olympicService.getOlympics();
    this.olympicService.loadInitialData();
    this.olympics$.pipe(
      filter(data => data != null), // filtre les undefined ou null
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: (data : Olympic| undefined| null) => {//récupération des données
        this.addToRawData(data as Olympic);
        this.updateGraph();
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des données :', err);
      },
      complete: () => {
      }
    });
    this.updateGraph();
  }
  updateGraph(){//fonction qui gère la mise à jour du graphique
    this.chart = {type: "pie",
      data:{
        labels:this.rawData.map((item:Olympic) => item.country ),
        datasets:[{
          label: "Medals ",
          data: this.rawData.map((item:Olympic) => item.participations.reduce((sum, p) => sum + p.medalsCount, 0))
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (_event: ChartEvent, activeElements: ActiveElement[]) => { //gestion du click sur un pays
          if (activeElements && activeElements.length > 0) {
            const index:number = activeElements[0].index;
            const countryId:number = this.rawData[index].id; // Récupération de l'id du pays
            this.router.navigate(['/country', countryId]); // Navigation vers la page de détails du pays
          }
        }
      }
    }
    if(this.rawData.length!=0){//pour éviter un undefined
      this.nbJo = this.rawData[0].participations.length;
      this.nbCountry = this.rawData.length;
    }
    if(this.pieChart != null){//on détruit le graphe déjà existant
      this.pieChart.destroy();
    }
    this.pieChart = new Chart(document.getElementById('graph') as ChartItem,this.chart);//on refait un nouveau graphe
  }
  addToRawData(newData: Olympic[] | Olympic) {
    const arrayData: Olympic[] = Array.isArray(newData) ? newData : [newData]; //conversion des données en une liste
    const rawDataMap = new Map(this.rawData.map(item => [item.id, item])); //utilisation d'une map pour accélérer les recherches
    arrayData.forEach(data => {
      const existingData = rawDataMap.get(data.id); //recherche du pays dans la map
      if (existingData) {//cas où il existe déjà, il faut ajouter les participations non existantes
        data.participations.forEach(participation => {
          const participationExists = existingData.participations.some(
            (item: Participation) => item.id === participation.id
          );
          if (!participationExists) {//la participation n'existe pas on l'ajoute
            existingData.participations.push(participation);
          }
        });
      } else {//le pays n'existe pas dans notre liste, on l'ajoute
        this.rawData.push(data);
        rawDataMap.set(data.id, data);
      }
    });
  }
  ngOnDestroy() { //on ferme les observables
    this.destroy$.next();
    this.destroy$.complete();
  }
}
