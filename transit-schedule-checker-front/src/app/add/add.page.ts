import { Component } from '@angular/core';
import { LoadingController, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { CookieService } from 'ngx-cookie-service';
import { zip } from 'rxjs';
import { ApiService } from '../api.service';
import { Type, Station, Destination, Transport, Schedule } from '../models';

@Component({
  selector: 'app-add',
  templateUrl: 'add.page.html',
  styleUrls: ['add.page.scss']
})
export class AddPage {
  constructor(public api: ApiService,
    public loadingController: LoadingController,
    public alertController: AlertController,
    public router: Router,
    public route: ActivatedRoute,
    private cookieService: CookieService) {

  }

  schedule = new Schedule();

  types: Type[] = Type.types;
  lines: Transport[] = [];
  stations: Station[] = [];
  destinations: Destination[] = [];

  customPopoverOptions: any = {
    cssClass: 'text-wrap-popover'
  };

  typeChanged(event) {
    this.getTransportsByType(event.detail.value);
  }

  lineChanged(event) {
    console.log(event);
    this.getStationsAndDestinationsByTransport(event.detail.value);
  }

  async addButtonClicked() {
    console.log(this.schedule.toUrl());

    let schedulesSaved: string;

    if (this.cookieService.check('schedules')) {
      schedulesSaved = this.cookieService.get('schedules');
      schedulesSaved += '|';
    } else {
      schedulesSaved = '';
    }

    schedulesSaved += this.schedule.toUrl();

    this.cookieService.set('schedules', schedulesSaved);

    const alert = await this.alertController.create({
      header: 'Add Transport',
      message: 'Success.',
      buttons: ['OK']
    });

    await alert.present();
  }

  async getTransportsByType(type: Type) {
    const loading = await this.loadingController.create({
      message: 'Loading...'
    });
    await loading.present();

    await this.api.getTransportsByType(type)
      .subscribe(res => {
        console.log(res);
        this.lines = res;
        this.stations = [];
        this.destinations = [];

        this.schedule.line = undefined;
        this.schedule.station = undefined;
        this.schedule.destination = undefined;

        loading.dismiss();
      }, err => {
        console.log(err);
        loading.dismiss();
      });
  }

  async getStationsAndDestinationsByTransport(transport: Transport) {
    const loading = await this.loadingController.create({
      message: 'Loading...'
    });
    await loading.present();

    const stations$ = this.api.getStationsByTransport(transport);
    const destinations$ = this.api.getDestinationsByTransport(transport);

    zip(stations$, destinations$, (stations: Station[], destinations: Destination[]) => ({ stations, destinations }))
      .subscribe(pair => {
        console.log(pair.stations);
        console.log(pair.destinations);
        this.stations = pair.stations;
        this.destinations = pair.destinations;

        this.schedule.station = undefined;
        this.schedule.destination = undefined;

        loading.dismiss();
      }, err => {
        console.log(err);
        loading.dismiss();
      });
  }
}
