import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';
import { HttpRequestsService } from './services/http-requests.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
// import { ShareButtonsModule } from '@ngx-share/buttons';
import { VenueDetailComponent } from './venue-detail/venue-detail.component';
import { VenuesListComponent } from './venues-list/venues-list.component';
import { AgmCoreModule } from '@agm/core';

@NgModule({
  declarations: [
    AppComponent,
    VenueDetailComponent,
    VenuesListComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyBXfmeLOz_du9dnoN3XvvPs2LA9etT2UPk',
      libraries: ['places']
    }),
    HttpClientModule,      // (Required) for share counts
    HttpClientJsonpModule,  // (Optional) for tumblr share counts
    // ShareButtonsModule.forRoot()
  ],
  providers: [
    HttpRequestsService
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
