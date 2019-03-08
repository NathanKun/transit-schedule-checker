import { Component, ViewChild } from '@angular/core';
import { LoadingController, AlertController } from '@ionic/angular';
import { LocalStorage } from '@ngx-pwa/local-storage';
import { Observable, forkJoin } from 'rxjs';
import { parseString } from 'xml2js';
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
    public loadingController: LoadingController,
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

      if (record.type === Type.TRANSILIEN) {
        obs = this.api.getTransilienSchedules(record.station.slug, record.transilienDestination.slug);
        observables.push(obs);
      } else {
        obs = this.api.getSchedulesByRecord(record);
        observables.push(obs);
      }

      obs.subscribe((res) => {
        record.schedules = res;
      }, err => {
        console.log(err);
      });
    }

    // TODO: this called twice the api!!
    forkJoin(...observables).subscribe(_ => {
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

    const records = Object.assign([], this.records);
    this.localStorage.setItem('records', records).subscribe(() => { });
  }
}
