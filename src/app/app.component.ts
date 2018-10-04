import { Component, OnInit } from '@angular/core';
import { HttpRequestsService } from './services/http-requests.service';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  title = 'Venues Finder';
  venues = {};
  categories = {};
  frmSearchOptions: FormGroup;
  message = '';

  constructor(private fb: FormBuilder, public readonly httpRequestsService: HttpRequestsService) {

    this.frmSearchOptions = fb.group({
      'category': [null],
      'place': [null, Validators.compose([Validators.required])]
      // 'place': [null, Validators.compose([Validators.required, Validators.pattern('^[A-Z]*$')])],
    });    

  }

  ngOnInit() {

    /* Fills categories from API */

    let apiCategoriesURL = 'https://api.foursquare.com/v2/venues/categories?' + environment.client_id + '&' + environment.client_secret + '&' +  environment.version;

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

  searchVenues(){

    console.log("///////////////////////////////////////");
    console.log(this.frmSearchOptions);
    console.log("///////////////////////////////////////");

    let category = this.frmSearchOptions.value.category;
    let place = this.frmSearchOptions.value.place;

    alert("searching venues in: " + place);

    let api_url = 'https://api.foursquare.com/v2/venues/search?' + environment.client_id + '&' + environment.client_secret + '&' +  environment.version;

    this.httpRequestsService.sendGetRequest(api_url + '&near=' + place + '&categoryId=' + category + '&limit=50').subscribe(

      res => {
        console.log(res);
        this.venues = res['response']['venues'];
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


}
