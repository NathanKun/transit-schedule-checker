import { Component, ViewChild } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { LocalStorage } from '@ngx-pwa/local-storage';
import { Observable, forkJoin } from 'rxjs';
import { ApiService } from '../api.service';
import { Schedule, Type, Record } from '../models';
@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss']
})
export class DashboardPage {

  @ViewChild('reorderGroup') reorderGroup: any;

  records: Record[] = [];
  showDeleteButtons = false;

  constructor(public api: ApiService,
    public alertController: AlertController,
    private localStorage: LocalStorage) {

  }

  ionViewWillEnter() {
    this.localStorage.getItem('records').subscribe((data: Record[]) => {
      if (data === null) {
        this.records = [];
      } else {
        this.records = data;
      }

      this.loadSchedules(null);
    });
  }

  loadSchedules(onFinished: Function) {
    const observables = [];
    for (const record of this.records) {
      let obs: Observable<Schedule[]>;
      if (record.type.name === Type.TRANSILIEN.name) {
        obs = this.api.getTransilienSchedules(record.station.slug, record.transilienDestination.slug);
        observables.push(obs);
      } else {
        obs = this.api.getSchedulesByRecord(record);
        observables.push(obs);
      }
    }

    forkJoin(...observables).subscribe(results => {
      for (let i = 0; i < results.length; i++) {
        this.records[i].schedules = results[i];
      }

      if (onFinished instanceof Function) {
        onFinished.apply(null);
      }
    });
  }

  doRefresh(event) {
    this.loadSchedules(() => {
      event.target.complete();
    });
  }

  deleteRecord(index: number) {
    this.records.splice(index, 1);

    const records = Object.assign([], this.records);
    this.localStorage.setItem('records', records).subscribe(() => { });
  }

  reorderButtonClicked() {
    this.reorderGroup.disabled = !this.reorderGroup.disabled;
  }

  reorderHandler(event) {
    this.records = event.detail.complete(this.records);

    const records: Record[] = this.records.map(x => Object.assign({}, x));
    for (const rec of records) {
      rec.schedules = undefined;
    }

    this.localStorage.setItem('records', records).subscribe(() => { });
  }
}
