import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'dashboard',
        children: [
          {
            path: '',
            loadChildren: '../dashboard/dashboard.module#DashboardPageModule'
          }
        ]
      },
      {
        path: 'add',
        children: [
          {
            path: '',
            loadChildren: '../add/add.module#AddPageModule'
          }
        ]
      },
      {
        path: 'traffic',
        children: [
          {
            path: '',
            loadChildren: '../traffic/traffic.module#TrafficPageModule'
          }
        ]
      },
      {
        path: '',
        redirectTo: '/tabs/dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/dashboard',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}
