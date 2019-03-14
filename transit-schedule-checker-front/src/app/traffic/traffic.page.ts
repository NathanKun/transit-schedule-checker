import { Component } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { ApiService } from '../api.service';
import { Traffic } from '../models';

@Component({
  selector: 'app-traffic',
  templateUrl: 'traffic.page.html',
  styleUrls: ['traffic.page.scss']
})
export class TrafficPage {
  noNormal = true;
  traffics: Traffic[];

  constructor(public api: ApiService,
    public loadingController: LoadingController) { }

  async ionViewWillEnter() {
    const loading = await this.loadingController.create({
      message: 'Loading...'
    });
    await loading.present();
    this.loadTraffics(() => loading.dismiss());
  }

  doRefresh(event) {
    this.loadTraffics(() => {
      event.target.complete();
    });
  }

  async changeNoNormal() {
    this.noNormal = !this.noNormal;

    const loading = await this.loadingController.create({
      message: 'Loading...'
    });
    await loading.present();
    this.loadTraffics(() => loading.dismiss());
  }

  private loadTraffics(onFinished: Function) {
    this.api.getRatpTraffic(this.noNormal).subscribe((res) => {
      this.traffics = res;

      if (onFinished instanceof Function) {
        onFinished.apply(null);
      }
    });
  }
}
