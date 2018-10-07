import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { HttpRequestsService } from '../services/http-requests.service';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ShareButtons } from '@ngx-share/core';
import { MapsAPILoader } from '@agm/core';
import { } from '@types/googlemaps';
import * as $ from 'jquery';
import 'bootstrap/js/dist/modal';

@Component({
  selector: 'app-venues-list',
  templateUrl: './venues-list.component.html',
  styleUrls: ['./venues-list.component.scss']
})


export class VenuesListComponent implements OnInit {

  @ViewChild('searchPlace') public searchPlaceElementRef: ElementRef;

  public latitude: number;
  public longitude: number;
  public zoom: number;
  public currentLocation = '';

  public title = 'Search for Venues';
  public venues = [];
  public categories = [];
  public frmSearchOptions: FormGroup;
  public message = '';
  public userCoords = '';
  public showCover = true;
  public venueId = '';
  public venueDetailURL = '';


  constructor(private fb: FormBuilder, public httpRequestsService: HttpRequestsService, private router: Router, private route: ActivatedRoute, public share: ShareButtons, private mapsAPILoader: MapsAPILoader, private ngZone: NgZone) {

    /* Declare the search options form (to search for venues) and its controls */
    this.frmSearchOptions = fb.group({
      'category': [""],
      'place': ["", Validators.compose([Validators.required])]
    });

    /* Get the venue id if it was passed as parameter, in order to open the venue detail in a modal window. */
    this.route.params.subscribe(
      res => {
        this.venueId = res.id;
        console.log("Venue ID: " + this.venueId)
      }
    );
  }

  ngOnInit() {

    // Get the categories from foursquare API.
    this.getCategories();

    // Initializes the autocomplete control for places.
    this.initAutocomplete();

    // Recovers any venues result saved into localstorage and display it.
    // this.venues = JSON.parse(localStorage.getItem("venues"));
    // if (this.venues != null && this.venues.length != 0) {
    //   this.showCover = false;
    // }

    // If a venue id was passes as paramenter, it means the user want to see the venue detail,
    // so, the venue details will be shown in a modal window. 
    if ((this.venueId != '') && (this.venueId != undefined)) {
      this.showVenueDetail(this.venueId);
    }
  }

  /**
   * Set the autocomplete control for using places google maps API.
   */
  initAutocomplete() {

    // Load places autocomplete
    this.mapsAPILoader.load().then(() => {

      let autocomplete = new google.maps.places.Autocomplete(this.searchPlaceElementRef.nativeElement, {
        types: []
      });

      // let geocoder = new google.maps.Geocoder;
      // let latlng = {lat: this.latitude, lng: this.longitude};
      // geocoder.geocode({'location': latlng}, function(results) {
      //     if (results[0]) {
      //       this.zoom = 8;
      //       this.currentLocation = results[0].formatted_address;
      //       console.log(results[0].address_components[4].long_name);
      //     } else {
      //       console.log('No results found');
      //     }
      // });

      autocomplete.addListener("place_changed", () => {
        this.ngZone.run(() => {
          //get the place result
          let place: google.maps.places.PlaceResult = autocomplete.getPlace();

          //verify result
          if (place.geometry === undefined || place.geometry === null) {
            return;
          }

          //set latitude, longitude and zoom
          this.latitude = place.geometry.location.lat();
          this.longitude = place.geometry.location.lng();
          this.zoom = 12;
        });
      });

    });
  }

  /**
   * Get the user's current position and search for venues around.
   */
  searchInCurrentLocation() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
        this.zoom = 12;
        this.searchVenues();
      });
    } else {
      alert("Geolocation not supported by this browser.");
    }
  }

  /** 
   * Calls the endpoint to get categories of venues.
   * This categories are displayed in the select component of header bar.
   */
  getCategories() {

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

  /**
   * Calls the endpoint to search for venues in the place and category indicated.
   * All results are displayed as a list below the header bar.
   */
  searchVenues() {

    if (this.latitude == null && this.longitude == null) {

      if (this.frmSearchOptions.get('place').invalid) {

        if (this.frmSearchOptions.get('place').hasError('required')) {
          alert("Please, provide a location where to search for places or click the other icon for search in your current location.");
          this.searchPlaceElementRef.nativeElement.focus();
        }
      }

    } else {

      this.message = '';

      let category = this.frmSearchOptions.value.category;
      let place = this.frmSearchOptions.value.place;

      let apiSearchVenuesURL = 'https://api.foursquare.com/v2/venues/search?' + environment.client_id + '&' + environment.client_secret + '&' + environment.version;

      if (category != null) {
        apiSearchVenuesURL += '&categoryId=' + category;
      }

      apiSearchVenuesURL += '&ll=' + this.latitude + ',' + this.longitude;

      // this.httpRequestsService.sendGetRequest(apiSearchVenuesURL + '&limit=50').subscribe(
      this.httpRequestsService.sendGetRequest("http://localhost:4200/assets/jsons/venues.json").subscribe(

        res => {
          console.log(res);
          this.venues = res['response']['venues'];

          // Save the venues result into localStorage in order to recover it (and display it again)
          // when the user request a venue detail and then go back to venues list.
          // localStorage.setItem("venues", JSON.stringify(this.venues));

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

  }

  /**
   *  Calls the endpoint to get the detail of a specific venue.
   *  The detail is displayed inside a bootstrap modal window. The modal content is filled using jquery.
   */

  showVenueDetail(venueId) {

    let apiGetVenueDetailURL = 'https://api.foursquare.com/v2/venues/' + venueId + '?' + environment.client_id + '&' + environment.client_secret + '&' + environment.version;

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
