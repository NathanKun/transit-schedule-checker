import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, tap, map } from 'rxjs/operators';
import { Type, Station, Destination, Transport, Record } from './models';

const apiUrl = 'https://api-ratp.pierre-grimaud.fr/v3';

@Injectable({ providedIn: 'root' })
export class ApiService {

  constructor(private http: HttpClient) { }

  getTransportsByType(type: Type): Observable<Transport[]> {
    const url = `${apiUrl}/lines/${type.name}`;

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
    const url = `${apiUrl}/stations/${transport.type.name}/${transport.code}?id=${transport.id}`;

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
    const url = `${apiUrl}/destinations/${transport.type.name}/${transport.code}?id=${transport.id}`;

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

  getSchedulesByRecord(record: Record): Observable<any> {
    const url = `${apiUrl}/schedules/${record.type.name}/${record.line.code}/${record.station.slug}/` +
      `${record.destination.way}?id=${record.line.id}`;

    return this.http.get<any>(url).pipe(
      map((res: any) => <Destination[]>res.result.schedules),
      tap(_ => console.log(
        `fetched schedules url=${url}`
      )),
      catchError(this.handleError<Destination[]>(
        `getSchedulesByRecord url=${url}`
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
