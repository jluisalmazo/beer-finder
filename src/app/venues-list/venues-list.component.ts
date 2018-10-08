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
//import 'bootstrap/js/dist/carousel';

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
  public venueId = '';
  public venueDetailURL = '';
  public showCover = true;
  public loading = false;

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

    this.showLoading();

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

    let apiCategoriesURL = 'https://api.foursquare.com/v2/venues/categories?' + environment.client_id + '&' + environment.client_secret + '&' + environment.version;

    // Uncomment this line and comment the nextone if you want to test in localhost calling a json file.
    //this.httpRequestsService.sendGetRequest("http://localhost:4200/assets/jsons/categories.json").subscribe(
    this.httpRequestsService.sendGetRequest(apiCategoriesURL).subscribe(
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

      this.showLoading();

      this.message = '';
      let category = this.frmSearchOptions.value.category;

      let apiSearchVenuesURL = 'https://api.foursquare.com/v2/venues/search?' + environment.client_id + '&' + environment.client_secret + '&' + environment.version;

      if (category != null) {
        apiSearchVenuesURL += '&categoryId=' + category;
      }

      apiSearchVenuesURL += '&ll=' + this.latitude + ',' + this.longitude;

      // Uncomment this line and comment the nextone if you want to test in localhost calling a json file.
      // this.httpRequestsService.sendGetRequest("http://localhost:4200/assets/jsons/venues.json").subscribe(
      this.httpRequestsService.sendGetRequest(apiSearchVenuesURL + '&limit=50').subscribe(

        res => {
          console.log(res);
          this.venues = res['response']['venues'];

          // Save the venues result into localStorage in order to recover it (and display it again)
          // when the user request a venue detail and then go back to venues list.
          // localStorage.setItem("venues", JSON.stringify(this.venues));

          this.showCover = false;
          this.loading = false;
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

    // Uncomment this line and comment the nextone if you want to test in localhost calling a json file.
    //this.httpRequestsService.sendGetRequest("http://localhost:4200/assets/jsons/venueDetail.json").subscribe(
    this.httpRequestsService.sendGetRequest(apiGetVenueDetailURL).subscribe(
    
      res => {
        console.log(res);

        let venueName = res['response']['venue']['name'];
        let venueLikes = res['response']['venue']['likes']['count'];
        
        let venueFormattedAddressArray = res['response']['venue']['location']['formattedAddress'];
        let venueFormattedAddress = '';
        for (let formattedAddress of venueFormattedAddressArray) {
          venueFormattedAddress += formattedAddress + '<br>';
        }

        let venuCategoriesArray = res['response']['venue']['categories'];
        let venueCategories = '';
        for (let category of venuCategoriesArray) {
          venueCategories += category['shortName'] + ', ';
        }
        venueCategories = venueCategories.substring(0, venueCategories.length - 2); // Removes the last comma  
        
        let venueTipsGroupsArray = res['response']['venue']['tips']['groups'];
        let venueTips = '';
        for (let group of venueTipsGroupsArray) {
          for(let tip of group['items']){
            venueTips += tip['text'] + '<br><br>';
          }
        }

        // Right now I only shows the first photo.
        let venuePhotosGroupsArray = res['response']['venue']['photos']['groups'];
        let venueFirstPhotoURL = '';
        for (let group of venuePhotosGroupsArray) {
          for(let photo of group['items']){
            if((photo['prefix'] != undefined && photo['prefix'] != null) && (photo['suffix'] != undefined && photo['suffix'] != null)) {
              if(venueFirstPhotoURL == ''){
                venueFirstPhotoURL = photo['prefix'] + 'original' + photo['suffix'];
              }
            }
          }
        }

        // I first wanted to show the best photo, but many venues don't have assigned one.
        // let venueBestPhoto = res['response']['venue']['bestPhoto'];
        // let venueBestPhotoURL = venueBestPhoto['prefix'] + 'original' + venueBestPhoto['suffix'];
        // let $venueBestPhotoElement = $("<img>").attr("src", venueBestPhotoURL);

        // Creates the elements to be appended
        let $venueFormattedAddressElement = $("<div>").addClass("address").append(venueFormattedAddress);
        let $venueCategoriesElement = $("<div>").addClass("categories").append(venueCategories);
        let $venueLikesElement = $("<div>").addClass("likes").append("Likes: ").append($("<span>").addClass("count").append(venueLikes)).append($("<img>").addClass("icon").attr("src", "assets/icons/heart.svg"));
        let $venueBestPhotoElement = $("<img>").attr("src", venueFirstPhotoURL);
        let $venueTipsElement = $("<div>").addClass("tips").append(venueTips);

        // Assigns the URL to be shared on social media.
        let hostname = location.href;
        if(location.pathname != '/'){
          hostname = hostname.replace(location.pathname, '');
        }        
        if(hostname.endsWith("/")){
          hostname = hostname.substring(0, hostname.length - 1);
        }
        this.venueDetailURL = hostname + '/venueDetail/' + venueId;
 
        $("#venue-detail .modal-title").html(venueName);
        $("#venue-detail .modal-body").html($venueFormattedAddressElement).append($venueCategoriesElement).append($venueLikesElement).append($venueBestPhotoElement).append($venueTipsElement);
        $("#venue-detail").modal('show');

        // Later on, I want to include a carousel with all images available in the api for this venue.
        // let $carouselItem = $("<div>").addClass("carousel-item").append($("<img>").addClass("d-block w-100").attr("src", venueBestPhotoURL));
        // $("#venue-detail .carousel .carousel-inner").append($carouselItem);
        // $('#venue-detail .carousel').carousel();

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

  showLoading() {
    this.showCover = false;
    this.loading = true;
  }

  gotoHome() {

    this.showCover=true;
    this.venues=[];   
  }

}
