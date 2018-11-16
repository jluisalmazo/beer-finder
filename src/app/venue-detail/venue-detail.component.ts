import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { HttpRequestsService } from '../services/http-requests.service';
import { HttpErrorResponse } from '@angular/common/http';
// import { ShareButtons } from '@ngx-share/core';
import * as $ from 'jquery';

@Component({
  selector: 'app-venue-detail',
  templateUrl: './venue-detail.component.html',
  styleUrls: ['./venue-detail.component.scss']
})
export class VenueDetailComponent implements OnInit {

  venueId = '';
  urlString = location.href;


  // constructor(private route: ActivatedRoute, private router: Router, public readonly httpRequestsService: HttpRequestsService, public readonly share: ShareButtons) { 
  constructor(private route: ActivatedRoute, private router: Router, public readonly httpRequestsService: HttpRequestsService) { 

    this.route.params.subscribe(
      res => {
        this.venueId = res.id;
        console.log(this.venueId)
      }
    );
  }

  ngOnInit() {
    this.showVenueDetail(this.venueId);
  }

  sendMeHome(){
  	this.router.navigate(['']);
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


        $(".venue-detail .content .title").html(venueName);
        $(".venue-detail .content .body").html(venueFormattedAddress).append($venueBestPhotoElement);
        //$(".venue-detail").modal('show');

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
