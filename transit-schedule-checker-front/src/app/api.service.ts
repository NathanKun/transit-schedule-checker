import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { Destination, Record, Schedule, Station, Traffic, Transport, Type } from './models';
import { Credentials } from './credentials';

const ratpUrl = 'https://transitapi.catprogrammer.com/ratp';
const transilienUrl = 'https://transitapi.catprogrammer.com/transilien.php';
const transilienUrlApi2 = 'https://transitapi.catprogrammer.com/transilien2.php';
const transilienUrlApi2StopAreas = 'https://transitapi.catprogrammer.com/transilien2-stopareas.php';

@Injectable({ providedIn: 'root' })
export class ApiService {

  constructor(
    private http: HttpClient) {
    this.initTransilienApi2StopAreas();
  }

  transilienApi2StopAreas: Station[];

  static normalizeStationString(str: string): string {
    return str.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  static parseXml(xml: string): Element {
    let dom;
    try {
      dom = (new DOMParser()).parseFromString(xml, 'text/xml');
    } catch (e) {
      dom = null;
    }
    return dom;
  }

  static xmlToJson(xml): any {
    // Create the return object
    let obj = {};

    if (xml.nodeType === 1) { // element
      // do attributes
      if (xml.attributes.length > 0) {
        obj['@attributes'] = {};
        for (let j = 0; j < xml.attributes.length; j += 1) {
          const attribute = xml.attributes.item(j);
          obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
        }
      }
    } else if (xml.nodeType === 3) { // text
      obj = xml.nodeValue;
    }

    // do children
    // If just one text node inside
    if (xml.hasChildNodes() && xml.childNodes.length === 1 && xml.childNodes[0].nodeType === 3) {
      obj = xml.childNodes[0].nodeValue;
    } else if (xml.hasChildNodes()) {
      for (let i = 0; i < xml.childNodes.length; i += 1) {
        const item = xml.childNodes.item(i);
        const nodeName = item.nodeName;
        if (typeof (obj[nodeName]) === 'undefined') {
          obj[nodeName] = ApiService.xmlToJson(item);
        } else {
          if (typeof (obj[nodeName].push) === 'undefined') {
            const old = obj[nodeName];
            obj[nodeName] = [];
            obj[nodeName].push(old);
          }
          obj[nodeName].push(ApiService.xmlToJson(item));
        }
      }
    }
    return obj;
  }

  getTransportsByType(type: Type): Observable<Transport[]> {
    const url = `${ratpUrl}/lines/${type.name}`;

    return this.http.get<Transport[]>(url).pipe(
      map((res: any) => {
        const list = <Transport[]>res.result[type.name];

        for (const t of list) {
          t.type = type;
        }

        return list;
      }),
      tap(_ => console.log(`fetched transports type=${type.toString()}`)),
      catchError(this.handleError<Transport[]>(`getTransportsByType type=${type.toString()}`))
    );
  }

  getStationsByTransport(transport: Transport): Observable<Station[]> {
    const url = `${ratpUrl}/stations/${transport.type.name}/${transport.code}?id=${transport.id}`;

    return this.http.get<Station[]>(url).pipe(
      map((res: any) => <Station[]>res.result.stations),
      tap(_ => console.log(
        `fetched stations type=${transport.type.toString()} code=${transport.code} id=${transport.id}`
      )),
      catchError(this.handleError<Station[]>(
        `getStationsByTransport type=${transport.type.toString()} code=${transport.code} id=${transport.id}`
      ))
    );
  }

  getDestinationsByTransport(transport: Transport): Observable<Destination[]> {
    const url = `${ratpUrl}/destinations/${transport.type.name}/${transport.code}?id=${transport.id}`;

    return this.http.get<Destination[]>(url).pipe(
      map((res: any) => <Destination[]>res.result.destinations),
      tap(_ => console.log(
        `fetched destinations type=${transport.type.toString()} code=${transport.code} id=${transport.id}`
      )),
      catchError(this.handleError<Destination[]>(
        `getDestinationsByTransport type=${transport.type.toString()} code=${transport.code} id=${transport.id}`
      ))
    );
  }

  getSchedulesByRecord(record: Record): Observable<Schedule[]> {
    const url = `${ratpUrl}/schedules/${record.type.name}/${record.line.code}/${record.station.slug}/` +
      `${record.destination.way}`;

    return this.http.get<Schedule[]>(url).pipe(
      map((res: any) => <Schedule[]>res.result.schedules),
      tap(_ => console.log(
        `fetched ratp schedules url=${url}`
      )),
      catchError((error: any): Observable<Schedule[]> => {
        const schedule = new Schedule();
        schedule.message = error.message;
        schedule.destination = 'error';

        this.handleError<Schedule[]>(
          `getSchedulesByRecord url=${url}`
        ).call(null, error);

        return of([schedule] as Schedule[]);
      })
    );
  }

  getTransilienSchedules(from: string, to: string): Observable<Schedule[]> {
    const body = new FormData();
    body.append('from', from);
    body.append('to', from);
    body.append('credential', Credentials.TransilienCredential);
    return this.http.post(
      transilienUrl,
      body,
      { observe: 'response', responseType: 'text' }).pipe(
      map((res: HttpResponse<string>) => {
          if (res.status === 200) {
            const schedules: Schedule[] = [];
            const xml = res.body;

            const result = ApiService.xmlToJson(ApiService.parseXml(xml));
            /*
            const example = {
              "passages": {
                "@attributes": {
                  "gare": "87382200"
                },
                "#text": ["\n"],
                "train": [
                  {
                    "date": "04/09/2020 14:54",
                    "#text": ["\n"],
                    "num": "134642",
                    "miss": "PEBU",
                    "term": "87384008"
                  },
                  {
                    "date": "04/09/2020 15:08",
                    "#text": ["\n"],
                    "num": "134644",
                    "miss": "PEBU",
                    "term": "87384008"
                  },
                  {
                    "date": "04/09/2020 15:23",
                    "#text": ["\n"],
                    "num": "134648",
                    "miss": "PEBU",
                    "term": "87384008"
              }]}}
            */


            if (!result.passages.train) {
              return [{ message: 'Api1 returns no schedule', destination: 'error' }];
            }

            const trains: any[] = result.passages.train;

            for (const train of trains) {
              const datetimeStr = train.date;
              const split = datetimeStr.split(' ');
              const dateSplit = split[0].split('/');
              const timeSplit = split[1].split(':');
              const datetime: number = new Date(dateSplit[2], dateSplit[1] - 1, dateSplit[0], timeSplit[0], timeSplit[1]).getTime();
              const diffMinutes = Math.floor((datetime - Date.now()) / 1000 / 60);

              const status = !!train.etat ? (' ' + train.etat[0]) : ''; // this could be: no attr, Retardé, Supprimé

              const schedule = new Schedule();
              schedule.message = `In ${diffMinutes} mins (${train.date}) ${status}`;
              schedule.destination = train.miss;

              schedules.push(schedule);
            }

            return schedules;

          } else {
            return [{ message: res.status + ' ' + res.statusText, destination: 'error' }];
          }
        }
      ),
      tap(_ => console.log(
        `fetched transilien schedules url=${transilienUrl}`
      )),
      catchError(this.handleError<Schedule[]>(
        `getTransilienSchedule`,
        [{
          message: 'getTransilienSchedule failed',
          destination: 'error'
        }]
      ))
    );
  }

  getTransilienSchedulesApi2(fromName: string, toName: string): Observable<Schedule[]> {
    return this.initTransilienApi2StopAreas().pipe( // ensure stop areas is fetched
      mergeMap(stations => {
        const api2From = this.findApi2StationByName(fromName, stations);
        const api2To = this.findApi2StationByName(toName, stations);

        if (!api2From || !api2To) {
          return of([{
            destination: 'error',
            message: `api2 station not found: api2From=${api2From ? api2From.name : 'undefined'} api2To=${api2To ? api2To.name : 'undefined'}`
          }]);
        }

        const body = new FormData();
        body.append('from', api2From.slug);
        body.append('fromname', api2From.name);
        body.append('to', api2To.slug);
        body.append('credential', Credentials.TransilienCredential);
        return this.http.post<any>(
          transilienUrlApi2,
          body
        ).pipe(
          map(res => {
            const schedules: Schedule[] = [];
            for (const data of res.nextTrainsList) {
              // calculate departure in x min
              const departureTime = data.departureTime;
              const departureTimeSplit = departureTime.split(':');
              const hour = departureTimeSplit[0];
              const minute = departureTimeSplit[1];
              const departureTimeObj = new Date();
              departureTimeObj.setHours(hour);
              departureTimeObj.setMinutes(minute);
              if (departureTimeObj.getTime() < Date.now()) {
                departureTimeObj.setDate(departureTimeObj.getDate() + 1);
                // setDate + 1 takes care of automatically incrementing the month if necessary
              }
              const diffMinutes = Math.floor((departureTimeObj.getTime() - Date.now()) / 1000 / 60);

              // construct messages
              /*let destinationMission = data.destinationMission;
              if (destinationMission.length > 20) {
                destinationMission = destinationMission.substr(0, 20) + '...';
              }*/

              const message =
                'In ' + diffMinutes + ' min (' + departureTime + ') ' +
                'Arrival at ' + data.arrivalTime;

              const message2 =
                (data.canceled ? 'CANCELED ' : '') +
                (data.delayed ? 'DELAYED ' : '') +
                `Platforme ${data.platform} ` +
                `to ${data.destinationMission}`;

              const message3 =
                (data.hasTraficDisruption ? 'TRAFFIC DISRUPTION' : '') +
                (data.hasTravauxDisruption ? 'TRAVAUX DISRUPTION' : '');

              schedules.push({
                message: message,
                message2: message2,
                message3: message3,
                destination: `${data.codeMission} ${data.typeTrain}`
              });
            }

            return schedules;
          }),
          tap(_ => console.log(
            `fetched transilien api2 schedules url=${transilienUrlApi2}`
          )),
          catchError(this.handleError<Schedule[]>(`getTransilienSchedulesApi2`, [{
            message: 'getTransilienSchedulesApi2 failed',
            destination: 'error'
          }]))
        );
      })
    );
  }

  getRatpTraffic(noNormal: boolean) {
    const url = `${ratpUrl}/traffic`;

    return this.http.get<Traffic[]>(url).pipe(
      map((res: any) => {
        const traffics: Traffic[] = [];
        res = res.result;

        if (!!res.metros) {
          for (const item of res.metros) {
            const traffic = item as Traffic;
            traffic.type = Type.METRO;

            traffics.push(traffic);
          }
        }

        if (!!res.rers) {
          for (const item of res.rers) {
            const traffic = item as Traffic;
            traffic.type = Type.RER;

            traffics.push(traffic);
          }
        }

        if (!!res.tramways) {
          for (const item of res.tramways) {
            const traffic = item as Traffic;
            traffic.type = Type.TRAMWAY;

            traffics.push(traffic);
          }
        }

        return traffics;
      }),
      map((traffics: Traffic[]) => traffics.filter(t => !noNormal || t.slug !== 'normal')),
      tap(_ => console.log(
        `fetched ratp traffic url=${url}`
      )),
      catchError(this.handleError<Traffic[]>(`getRatpTraffic`, [{
        line: '',
        message: 'getRatpTrafficByRecord failed',
        slug: '',
        title: 'error',
        type: null
      }]))
    );
  }

  getRatpTrafficByRecord(record: Record) {
    const url = `${ratpUrl}/traffic/${record.type.name}/${record.line.code}`;

    return this.http.get<Traffic>(url).pipe(
      map((res: any) => {
        const traffic = res.result as Traffic;
        traffic.type = record.type;

        return traffic;
      }),
      tap(_ => console.log(
        `fetched ratp traffic by record url=${url}`
      )),
      catchError(this.handleError<Traffic>(`getRatpTrafficByRecord`,
        {
          line: record.line.name,
          message: 'getRatpTrafficByRecord failed',
          slug: '',
          title: 'error',
          type: record.type
        }))
    );
  }

  private initTransilienApi2StopAreas(): Observable<Station[]> {
    if (this.transilienApi2StopAreas) {
      return of(this.transilienApi2StopAreas);
    } else {
      const body = new FormData();
      body.append('credential', Credentials.TransilienCredential);

      return this.http.post<any>(
        transilienUrlApi2StopAreas,
        body
      ).pipe(
        map((res: any) => {
          const stations: Station[] = [];
          for (const p of res.content) {
            stations.push({ name: p.label, slug: p.uic });
          }
          return stations;
        }),
        tap(_ => console.log(
          `fetched transilien api2 stop areas url=${transilienUrlApi2StopAreas}`
        )),
        tap(stations =>
          this.transilienApi2StopAreas = stations
        ),
        catchError(this.handleError<Station[]>(`getTransilienApi2StopAreas`, []))
      );
    }
  }

  private findApi2StationByName(name: string, stations: Station[]): Station {
    let station: Station = stations.find(
      s => ApiService.normalizeStationString(s.name) === ApiService.normalizeStationString(name));
    if (!station) {
      const res = stations.filter(
        s => ApiService.normalizeStationString(s.name).indexOf(ApiService.normalizeStationString(name)) >= 0);
      if (res.length) {
        station = res[0];
      }
    }

    return station;
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      console.error(operation);
      console.error(error);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
