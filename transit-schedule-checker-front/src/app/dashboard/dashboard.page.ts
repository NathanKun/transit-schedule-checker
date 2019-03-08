import { Component, ViewChild } from '@angular/core';
import { LoadingController, AlertController } from '@ionic/angular';
import { LocalStorage } from '@ngx-pwa/local-storage';
import { ApiService } from '../api.service';
import { Record } from '../models';
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
    for (const record of this.records) {
      this.api.getSchedulesByRecord(record).subscribe(res => {
        console.log(res);
        record.schedules = res;

        if (onFinished instanceof Function) {
          onFinished.apply(null);
        }
      }, err => {
        console.log(err);
      });
    }
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
