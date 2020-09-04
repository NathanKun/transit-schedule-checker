import { Component, Input, OnInit } from '@angular/core';
import { Record } from '../models';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-dashboard-record-model',
  templateUrl: './dashboard-record-model.component.html',
  styleUrls: ['./dashboard-record-model.component.scss'],
})
export class DashboardRecordModelComponent {

  @Input() record: Record;

  constructor(public modalController: ModalController) {
  }

  async dismissModal() {
    await this.modalController.dismiss();
  }
}
