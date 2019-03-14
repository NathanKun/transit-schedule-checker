import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { parseString } from 'xml2js';
import { Type, Station, Destination, Transport, Record, Schedule, Traffic } from './models';

const ratpUrl = 'https://transitapi.catprogrammer.com/ratp';
const transilienUrl = 'https://transitapi.catprogrammer.com/transilien.php';

@Injectable({ providedIn: 'root' })
export class ApiService {

  constructor(
    private http: HttpClient) { }

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
    const url = `${transilienUrl}?from=${from}&to=${to}`;

    return this.http.get(url, { observe: 'response', responseType: 'text' }).pipe(
      map((res: HttpResponse<string>) => {
        if (res.status === 200) {
          const schedules: Schedule[] = [];
          const xml = res.body;

          parseString(xml, (err, result) => { // this is a sync function
            /*
            const example = {
              'passages': {
                '$': { 'gare': '87382200' },
                'train': [
                  {
                    'date': [{
                      '_': '11/03/2019 15:38',
                      '$': { 'mode': 'R' }
                    }],
                    'num': ['134647'],
                    'miss': ['SEBU'],
                    'term': ['87382481']
                  }, {
                    'date': [{
                      '_': '11/03/2019 15:53',
                      '$': { 'mode': 'R' }
                    }],
                    'num': ['134649'],
                    'miss': ['SEBU'],
                    'term': ['87382481']
                  }
                ]
              }
            };
            */

            if (err != null) {
              const schedule = new Schedule();
              schedule.message = res.status + ' ' + res.statusText;
              schedule.destination = 'error';

              return [schedule];
            }

            const trains: any[] = result.passages.train;

            for (const train of trains) {
              const datetimeStr = train.date[0]._;
              const split = datetimeStr.split(' ');
              const dateSplit = split[0].split('/');
              const timeSplit = split[1].split(':');
              const datetime: number = new Date(dateSplit[2], dateSplit[1] - 1, dateSplit[0], timeSplit[0], timeSplit[1]).getTime();
              const diffMinutes = Math.floor((datetime - Date.now()) / 1000 / 60);

              const mode = train.date[0].$.mode === 'R' ? '' : ' Theory'; // this could be: R or T. R for Real time, T for Theory
              const status = !!train.etat ? (' ' + train.etat[0]) : ''; // this could be: no attr, Retardé, Supprimé

              const schedule = new Schedule();
              schedule.message = `In ${diffMinutes} mins (${train.date[0]._})${mode}${status}`;
              schedule.destination = train.miss;

              schedules.push(schedule);
            }
          });

          return schedules;

        } else {
          const schedule = new Schedule();
          schedule.message = res.status + ' ' + res.statusText;
          schedule.destination = 'error';

          return [schedule];
        }
      }),
      tap(_ => console.log(
        `fetched transilien schedules url=${url}`
      )),
      catchError(this.handleError<Schedule[]>(
        `getTransilienSchedule`
      ))
    );
  }

  public getRatpTraffic(noNormal: boolean) {
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
      catchError(this.handleError<Traffic[]>(`getRatpTraffic`))
    );
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
