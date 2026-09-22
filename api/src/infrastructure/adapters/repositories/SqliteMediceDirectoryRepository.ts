import { randomUUID } from 'crypto';
import { injectable } from 'tsyringe';
import { DatabaseConfig } from '@/infrastructure/config/database';
import type { MediceDirectoryRepository } from '@/domain/repositories/MediceDirectoryRepository';
@injectable()
export class SqliteMediceDirectoryRepository implements MediceDirectoryRepository {
 private get db(){return DatabaseConfig.getKnex();}
 async listVolunteers(){return this.db('volunteer_profiles as vp').join('users as u','u.id','vp.user_id').where('vp.status','active').select('vp.*','u.name','u.email','u.profile_image_id').select(this.db.raw('(SELECT COUNT(*) FROM patient_assignments pa WHERE pa.user_id = vp.user_id) as active_patients'));}
 listAllowlist(){return this.db('app_settings_allowed_users').select('email','created_at').orderBy('email');}
 async addAllowlist(email:string,actorId:string,timestamp:string){await this.db.transaction(async trx=>{await trx('app_settings_allowed_users').insert({email,created_at:timestamp});await trx('audit_events').insert({id:randomUUID(),actor_id:actorId,action:'access.allowlist_added',entity_type:'allowlist',entity_id:null,metadata_json:'{}',created_at:timestamp});});}
 async stats(userId:string,global:boolean,periodDays:number){const since=new Date(Date.now()-periodDays*86400000).toISOString();const recent=this.db('follow_ups').where('occurred_at','>=',since);const all=this.db('follow_ups');if(!global){recent.where({author_id:userId});all.where({author_id:userId});}const r:any=await recent.clone().count({count:'*'}).first();const t:any=await all.select(this.db.raw('COUNT(*) as visits'),this.db.raw('COALESCE(SUM(duration_minutes),0) as duration_minutes'),this.db.raw('COUNT(DISTINCT patient_id) as patients_attended')).first();const data:any={visits:Number(t?.visits??0),durationHours:Number(t?.duration_minutes??0)/60,patientsAttended:Number(t?.patients_attended??0),recentVisits:Number(r?.count??0)};if(global){const [a,p,v]=await Promise.all([this.db('alerts').where({status:'active'}).count({count:'*'}).first(),this.db('patients').whereNull('archived_at').count({count:'*'}).first(),this.db('volunteer_profiles').where({status:'active'}).count({count:'*'}).first()]);Object.assign(data,{activeAlerts:Number(a?.count??0),activePatients:Number(p?.count??0),activeVolunteers:Number(v?.count??0)});}return data;}
}
