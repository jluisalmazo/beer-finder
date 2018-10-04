import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable()
export class HttpRequestsService {

    constructor(private readonly http: HttpClient) { }

    sendGetRequest(webservice_URL: string) {

        console.log("Sending GET request to: " + webservice_URL);

        return this.http.get(webservice_URL);
    }

    sendPostRequest(webservice_URL: string, request: {}) {

        console.log("Sending POST request: " + JSON.stringify(request) + " to: " + webservice_URL);
        
        return this.http.post(webservice_URL, request);
    }
    
}
