import { EventEmitter, Injectable, OnInit } from '@angular/core';

import {
  OneSignal,
  OSNotification,
  OSNotificationPayload,
} from '@ionic-native/onesignal/ngx';

import { Storage } from '@ionic/storage';

@Injectable({
  providedIn: 'root',
})
export class PushService implements OnInit {
  private _storage: Storage | null = null;

  mensaje: OSNotificationPayload[] = [
    // {
    //   title: 'Título de la push',
    //   body: 'Este es el body de la push',
    //   date: new Date(),
    // },
  ];

  userId: string;

  pushListener = new EventEmitter<OSNotificationPayload>();

  constructor(private oneSignal: OneSignal, private storage: Storage) {
    this.init();
  }

  async ngOnInit() {
    // await this.init();
    await this.cargarMensajes();
  }

  async init() {
    // If using, define drivers here: await this.storage.defineDriver(/*...*/);
    const storage = await this.storage.create();
    this._storage = storage;
  }

  async getMensajes() {
    await this.cargarMensajes();
    return [...this.mensaje];
  }

  configuracionInicial() {
    this.oneSignal.startInit(
      'dd7f3efe-a696-4517-b88c-b19560137987',
      '733714102060'
    );

    this.oneSignal.inFocusDisplaying(
      this.oneSignal.OSInFocusDisplayOption.Notification
    );

    this.oneSignal.handleNotificationReceived().subscribe((noti) => {
      // do something when notification is received
      console.log('Notificacion recibida', noti);
      this.notificacionRecibida(noti);
    });

    this.oneSignal.handleNotificationOpened().subscribe(async (noti) => {
      // do something when a notification is opened
      console.log('Notificacion abierta', noti);
      await this.notificacionRecibida(noti.notification);
    });

    // Obtener ID del suscriptor
    this.oneSignal.getIds().then((info) => {
      this.userId = info.userId;
      console.log('User Id', this.userId);
    });

    this.oneSignal.endInit();
  }

  async notificacionRecibida(notificacion: OSNotification) {
    await this.cargarMensajes();

    const payload = notificacion.payload;

    const existePush = this.mensaje.find(
      (mensaje) => mensaje.notificationID === payload.notificationID
    );

    if (existePush) {
      return;
    }

    this.mensaje.unshift(payload);
    this.pushListener.emit(payload);

    await this.guardarMensajes();
  }

  async guardarMensajes() {
    await this._storage.set('pushes', this.mensaje);
  }

  async cargarMensajes() {
    this.mensaje = (await this._storage.get('pushes')) || [];
    return this.mensaje;
  }

  async borrarMensajes() {
    await this._storage.clear();
    this.mensaje = [];
    this.guardarMensajes();
  }

}
