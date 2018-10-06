import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { HttpRequestsService } from '../services/http-requests.service';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ShareButtons } from '@ngx-share/core';
import * as $ from 'jquery';
import 'bootstrap/js/dist/modal';

//import { $ } from 'protractor';

@Component({
  selector: 'app-venues-list',
  templateUrl: './venues-list.component.html',
  styleUrls: ['./venues-list.component.scss']
})
export class VenuesListComponent implements OnInit {

  title = 'Search for Venues';
  venues = [];
  categories = [];
  frmSearchOptions: FormGroup;
  message = '';
  userCoords = '';
  showCover = true;
  venueId = '';
  venueDetailURL = '';

  constructor(private route: ActivatedRoute, private router: Router, private fb: FormBuilder, public readonly httpRequestsService: HttpRequestsService, public readonly share: ShareButtons) {

    /* Declare the search options form (to search for venues) and its controls */
    this.frmSearchOptions = fb.group({
      'category': [""],
      'place': [""]
    });

    this.route.params.subscribe(
      res => {
        this.venueId = res.id;
        console.log("Venue ID: " + this.venueId)
      }
    );
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

    /* Recovers any venues result saved into localstorage and display it */
    this.venues = JSON.parse(localStorage.getItem("venues"));
    if(this.venues != null && this.venues.length != 0){
      this.showCover = false;
    }

    if((this.venueId != '') && (this.venueId != undefined)){
      this.showVenueDetail(this.venueId);    
    }
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
        
        /*
        Save the venues result into localStorage in order to recover it (and display it again)
        when the user request a venue detail and then go back to venues list.
        */
        localStorage.setItem("venues", JSON.stringify(this.venues));
        
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

        // this.venueDetailURL = location.hostname + '/venueDetail/' + venueId;
        // this.venueDetailURL = 'https://blogs.cisco.com/enterprise/intent-based-networking-a-platform-designed-for-change'; //Para pruebas.
        this.venueDetailURL = 'http://poettier.com/venueDetail/' + venueId; //A la hora de enviarla hay que comentarla y descomentar la primera.

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
