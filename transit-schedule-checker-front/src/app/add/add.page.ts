import { Component } from '@angular/core';
import { LoadingController, AlertController } from '@ionic/angular';
import { LocalStorage } from '@ngx-pwa/local-storage';
import { zip } from 'rxjs';
import { ApiService } from '../api.service';
import { Type, Station, Destination, Transport, Record, TransilienStations } from '../models';

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
  transilienDestinations: Station[] = [];

  filteredTransilienFromStations: Station[] = [];
  filteredTransilienToStations: Station[] = [];

  typeIsTransilien = false;

  inputTransilienFromStation = '';
  inputTransilienToStation = '';

  transilienFromInputTagFocus = false;
  transilienToInputTagFocus = false;

  customPopoverOptions: any = {
    cssClass: 'text-wrap-popover'
  };

  typeChanged(event) {
    const value = event.detail.value;
    if (value === '') {
      return;
    }

    if (value === Type.TRANSILIEN) {
      this.typeIsTransilien = true;

      this.lines = [Transport.TRANSILIEN];
      this.stations = TransilienStations;
      this.transilienDestinations = TransilienStations;
      this.destinations = [];

      this.record.line = Transport.TRANSILIEN;
      this.record.station = undefined;
      this.record.transilienDestination = undefined;
      this.record.destination = undefined;
    } else {
      this.typeIsTransilien = false;
      this.getTransportsByType(value);
    }

  }

  lineChanged(event) {
    const value = event.detail.value;
    if (value === '' || value === Transport.TRANSILIEN) {
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

  searchTransilienFrom() {
    if (this.inputTransilienFromStation.trim().length < 3 || !this.transilienFromInputTagFocus) {
      this.filteredTransilienFromStations = [];
      return;
    }

    this.filteredTransilienFromStations = this.stations.filter(
      (item: Station) => item.name.toUpperCase().includes(this.inputTransilienFromStation.toUpperCase())
    );
  }

  searchTransilienTo() {
    if (this.inputTransilienToStation.trim().length < 3 || !this.transilienToInputTagFocus) {
      this.filteredTransilienToStations = [];
      return;
    }

    this.filteredTransilienToStations = this.stations.filter(
      (item: Station) => item.name.toUpperCase().includes(this.inputTransilienToStation.toUpperCase())
    );
  }

  transilienFromSelected(station: Station) {
    this.record.station = station;
    this.inputTransilienFromStation = station.name;
    this.filteredTransilienFromStations = [];
  }

  transilienToSelected(station: Station) {
    this.record.transilienDestination = station;
    this.inputTransilienToStation = station.name;
    this.filteredTransilienToStations = [];
  }

  transilienFromInputTagFocused() {
    this.transilienFromInputTagFocus = true;
  }

  transilienFromInputTagBlured() {
    this.transilienFromInputTagFocus = false;
  }

  transilienToInputTagFocused() {
    this.transilienToInputTagFocus = true;
  }

  transilienToInputTagBlured() {
    this.transilienToInputTagFocus = false;
  }
}
