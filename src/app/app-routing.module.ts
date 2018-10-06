import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { VenuesListComponent } from './venues-list/venues-list.component';
import { VenueDetailComponent } from './venue-detail/venue-detail.component';

const routes: Routes = [
    {
        path: '',
        component: VenuesListComponent
    },
    {
        path: 'venueDetail/:id',
        component: VenuesListComponent
    }

    // {
    //     path: 'venueDetail/:id',
    //     component: VenueDetailComponent
    // }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }