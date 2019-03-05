import { Component } from '@angular/core';
import { LoadingController, AlertController } from '@ionic/angular';
import { LocalStorage } from '@ngx-pwa/local-storage';
import { ApiService } from '../api.service';
import { Type, Station, Destination, Transport, Schedule, Record } from '../models';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss']
})
export class DashboardPage {

  records: Record[] = [];

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

      console.log(this.records);
    });
  }
}
