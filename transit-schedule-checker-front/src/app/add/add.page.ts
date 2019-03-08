import { Component } from '@angular/core';
import { LoadingController, AlertController } from '@ionic/angular';
import { LocalStorage } from '@ngx-pwa/local-storage';
import { zip } from 'rxjs';
import { ApiService } from '../api.service';
import { Type, Station, Destination, Transport, Record } from '../models';

@Component({
  selector: 'app-add',
  templateUrl: 'add.page.html',
  styleUrls: ['add.page.scss']
})
export class AddPage {
  constructor(public api: ApiService,
    public loadingController: LoadingController,
    public alertController: AlertController,
    private localStorage: LocalStorage) {

  }

  record = new Record();

  types: Type[] = Type.types;
  lines: Transport[] = [];
  stations: Station[] = [];
  destinations: Destination[] = [];

  customPopoverOptions: any = {
    cssClass: 'text-wrap-popover'
  };

  typeChanged(event) {
    const value = event.detail.value;
    if (value === '') {
      return;
    }
    this.getTransportsByType(value);
  }

  lineChanged(event) {
    const value = event.detail.value;
    if (value === '') {
      return;
    }
    this.getStationsAndDestinationsByTransport(event.detail.value);
  }

  addButtonClicked() {
    this.localStorage.getItem('records').subscribe((records: Record[]) => {
      if (records === null) {
        records = [];
      }
      records.push(this.record);

      this.localStorage.setItem('records', records).subscribe(() => {
        this.alertController.create({
          header: 'Add Transport',
          message: 'Success.',
          buttons: ['OK']
        }).then((a) => a.present());
      });
    });
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

        this.record.line = undefined;
        this.record.station = undefined;
        this.record.destination = undefined;

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

        this.record.station = undefined;
        this.record.destination = undefined;

        loading.dismiss();
      }, err => {
        console.log(err);
        loading.dismiss();
      });
  }
}
