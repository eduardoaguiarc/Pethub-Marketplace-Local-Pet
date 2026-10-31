package br.com.pethub;

import static br.com.pethub.Domain.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional
public class PetService {
    private final Db db;
    public PetService(Db db) { this.db=db; }
    public Pet owned(Account a,String id) { Pet p=db.get(Pet.class,id); if(!p.ownerId.equals(a.id)) throw ApiException.forbidden(); return p; }
    public Pet save(Account a,String id,Requests.PetInput r) {
        AuthService.role(a,Role.TUTOR); Pet p=id==null?new Pet():owned(a,id);
        p.ownerId=a.id; p.name=r.name(); p.species=r.species(); p.breed=r.breed(); p.ageLabel=r.ageLabel(); p.weightKg=r.weightKg(); p.size=r.size(); p.avatarUrl=r.avatarUrl(); p.vaccineStatus=r.vaccineStatus(); p.severeDermatitisHistory=r.severeDermatitisHistory();
        return id==null?db.save(p):p;
    }
    public void delete(Account a,String id) { owned(a,id).active=false; }
    public List<Pet> list(Account a,int page,int size) { return db.page(Pet.class,"from Pet p where p.ownerId=?1 and p.active=true order by p.name,p.id",page*size,size,a.id); }
    public Map<String,Object> history(Account a,String id,int page,int size) {
        owned(a,id);
        return Map.of("notes",db.page(BehaviorNote.class,"from BehaviorNote n where n.petId=?1 order by n.createdAt desc,n.id",page*size,size,id),"orders",db.page(Purchase.class,"from Purchase o where o.petId=?1 order by o.createdAt desc,o.id",page*size,size,id));
    }
}
