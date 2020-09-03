import { Component, ViewChild } from '@angular/core';
import { LocalStorage } from '@ngx-pwa/local-storage';
import { forkJoin, Observable } from 'rxjs';
import { ApiService } from '../api.service';
import { Record, Schedule, Type } from '../models';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss']
})
export class DashboardPage {

  @ViewChild('reorderGroup') reorderGroup: any;

  records: Record[] = [];

  constructor(public api: ApiService,
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
    if (this.records.length === 0) {
      if (onFinished instanceof Function) {
        onFinished.apply(null);
      }
    }

    const observables: Observable<Schedule[]>[] = [];
    for (const record of this.records) {
      // schedules
      let obs: Observable<Schedule[]>;
      if (record.type.name === Type.TRANSILIEN.name) {
        obs = this.api.getTransilienSchedules(record.station.slug, record.transilienDestination.slug);
        observables.push(obs);
      } else {
        obs = this.api.getSchedulesByRecord(record);
        observables.push(obs);
      }

      // traffics
      if (record.type.name !== Type.TRANSILIEN.name && record.type.hasTrafic) {
        this.api.getRatpTrafficByRecord(record).subscribe(res => {
          record.traffic = res;
        });
      }
    }

    forkJoin(...observables).subscribe((results: Schedule[][]) => {
      for (let i = 0; i < results.length; i++) {
        this.records[i].schedules = results[i];

        // if transilien api1 returns error, use transilien api2
        if (results[i].length === 0 || results[i][0].destination === 'error') {
          this.api.getTransilienSchedulesApi2(this.records[i].station.name, this.records[i].transilienDestination.name)
            .subscribe(
              resApi2 => {
                this.records[i].schedules = this.records[i].schedules.concat(resApi2.slice(0, 5));
              });
        }
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
    this.localStorage.setItem('records', records).subscribe(() => {
    });
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

    this.localStorage.setItem('records', records).subscribe(() => {
    });
  }
}
