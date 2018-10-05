import { Component, OnInit } from '@angular/core';
import { HttpRequestsService } from './services/http-requests.service';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as $ from 'jquery';
import 'bootstrap/js/dist/modal';

//import { $ } from 'protractor';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  title = 'Search for Venues';
  venues = [];
  categories = [];
  frmSearchOptions: FormGroup;
  message = '';
  userCoords = '';
  showCover = true;

  constructor(private fb: FormBuilder, public readonly httpRequestsService: HttpRequestsService) {

    this.frmSearchOptions = fb.group({
      'category': [""],
      'place': [""]
    });

  }

  ngOnInit() {

    /* Fills categories from API */

    // let apiCategoriesURL = 'https://api.foursquare.com/v2/venues/categories?' + environment.client_id + '&' + environment.client_secret + '&' + environment.version;

    // this.httpRequestsService.sendGetRequest(apiCategoriesURL).subscribe(
    this.httpRequestsService.sendGetRequest("http://localhost:4200/assets/jsons/categories.json").subscribe(
      res => {
        console.log(res);
        this.categories = res['response']['categories'];

      },
      (err: HttpErrorResponse) => {
        console.log(err);
        this.message = err['error']['meta']['errorDetail'];
        if (err.status >= 500) {
          this.message = 'Server-side error occured: ' + this.message;
        } else {
          this.message = 'Client-side error occured: ' + this.message;
        }
      }
    );

  }

  searchVenues() {

    console.log("///////////////////////////////////////");
    console.log(this.frmSearchOptions);
    console.log("///////////////////////////////////////");

    this.message = '';

    let category = this.frmSearchOptions.value.category;
    let place = this.frmSearchOptions.value.place;

    // alert("searching venues in: " + place);
    // alert(this.userCoords);

    let apiSearchVenuesURL = 'https://api.foursquare.com/v2/venues/search?' + environment.client_id + '&' + environment.client_secret + '&' + environment.version;

    if ((place != null) && (place != '')) {
      apiSearchVenuesURL += '&near=' + place;
    } else {
      apiSearchVenuesURL += '&ll=' + this.userCoords;
    }

    if (category != null) {
      apiSearchVenuesURL += '&categoryId=' + category;
    }

    // this.httpRequestsService.sendGetRequest(apiSearchVenuesURL + '&limit=50').subscribe(
    this.httpRequestsService.sendGetRequest("http://localhost:4200/assets/jsons/venues.json").subscribe(

      res => {
        console.log(res);
        this.venues = res['response']['venues'];
        this.showCover = false;
      },
      (err: HttpErrorResponse) => {

        console.log(err);
        this.message = err['error']['meta']['errorDetail'];
        if (err.status >= 500) {
          this.message = 'Server-side error occured: ' + this.message;
        } else {
          if (err.status == 429) {
            this.message = 'Foursquare quota for this endpoint was exceeded. Please, try tomorrow.';
          } else {
            this.message = 'Client-side error occured: ' + this.message;
          }
        }
        alert(this.message);
      }
    );

  }

  getCurrentLocation() {

    var self = this;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (position) {
        let latitude = position.coords.latitude;
        let longitude = position.coords.longitude;
        self.userCoords = latitude + ',' + longitude;

        self.searchVenues();
      });
    } else {
      alert("Geolocation not supported by this browser.");
    }
  }


  showVenueDetail(venueId) {

    // let apiGetVenueDetailURL = 'https://api.foursquare.com/v2/venues/' + venueId + '?' + environment.client_id + '&' + environment.client_secret + '&' + environment.version;

    // this.httpRequestsService.sendGetRequest(apiGetVenueDetailURL).subscribe(
    this.httpRequestsService.sendGetRequest("http://localhost:4200/assets/jsons/venueDetail.json").subscribe(

      res => {
        console.log(res);

        let venueName = res['response']['venue']['name'];
        let venueFormattedAddress = res['response']['venue']['location']['formattedAddress'];
        let venueBestPhoto = res['response']['venue']['bestPhoto'];

        let venueBestPhotoURL = venueBestPhoto['prefix'] + 'original' + venueBestPhoto['suffix'];


        let $venueBestPhotoElement = $("<img>").attr("src", venueBestPhotoURL);


        $("#venue-detail .modal-title").html(venueName);
        $("#venue-detail .modal-body").html(venueFormattedAddress).append($venueBestPhotoElement);
        $("#venue-detail").modal('show');

      },
      (err: HttpErrorResponse) => {

        console.log(err);
        let errorMessage = err['error']['meta']['errorDetail'];
        if (err.status >= 500) {
          errorMessage = 'Server-side error occured: ' + errorMessage;
        } else {
          if (err.status == 429) {
            errorMessage = 'Foursquare quota for this endpoint was exceeded. Please, try tomorrow.';
          } else {
            errorMessage = 'Client-side error occured: ' + errorMessage;
          }
        }
        alert(errorMessage);
      }
    );

  }

}
