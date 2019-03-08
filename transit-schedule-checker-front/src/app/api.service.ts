import { Injectable, isDevMode } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { parseString } from 'xml2js';
import { Type, Station, Destination, Transport, Record, Schedule } from './models';

const ratpUrl = 'https://api-ratp.pierre-grimaud.fr/v3';
const transilienUrl = isDevMode() ? 'http://localhost:8000/transilien.php' : 'https://transitapi.catprogrammer.com/transilien.php';

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

    return this.http.get<any>(url).pipe(
      map((res: any) => <Schedule[]>res.result.schedules),
      tap(_ => console.log(
        `fetched schedules url=${url}`
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

  getTransilienSchedules(from: string, to: string): Observable<any> {
    const url = `${transilienUrl}?from=${from}&to=${to}`;

    return this.http.get(url, { observe: 'response' }).pipe(
      map((res: HttpResponse<Schedule[]>) => {
        if (res.status === 200) {
          const xml = res.body;
          const schedules: Schedule[] = [];

          parseString(xml, (err, result) => {
            console.log(result);
            console.log(err);
          });

          return schedules;
        } else {
          const schedule = new Schedule();
          schedule.message = res.status + ' ' + res.statusText;
          schedule.destination = 'error';

          return schedule;
        }
      }),
      tap(_ => console.log(
        `fetched transilien schedules url=${url}`
      )),
      catchError(this.handleError<Destination[]>(
        `getTransilienSchedule`
      ))
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
