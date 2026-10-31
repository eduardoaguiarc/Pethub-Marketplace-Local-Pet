package br.com.pethub.repository;

import br.com.pethub.exception.ApiException;

import jakarta.persistence.*;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public class Db {
    @PersistenceContext
    EntityManager em;

    public <T> T save(T entity) {
        em.persist(entity);
        return entity;
    }

    public <T> T get(Class<T> type, String id) {
        T value = id == null ? null : em.find(type, id);
        if (value == null)
            throw ApiException.notFound("Recurso não encontrado");
        return value;
    }

    public <T> T lock(Class<T> type, String id) {
        T value = em.find(type, id, LockModeType.PESSIMISTIC_WRITE);
        if (value == null)
            throw ApiException.notFound("Recurso não encontrado");
        return value;
    }

    public <T> List<T> list(Class<T> type, String jpql, Object... parameters) {
        return page(type, jpql, 0, 1000, parameters);
    }

    public <T> List<T> page(Class<T> type, String jpql, int offset, int limit, Object... parameters) {
        var query = em.createQuery(jpql, type);
        for (int i = 0; i < parameters.length; i++)
            query.setParameter(i + 1, parameters[i]);
        return query.setFirstResult(offset).setMaxResults(limit).getResultList();
    }

    public long count(String jpql, Object... parameters) {
        return list(Long.class, jpql, parameters).getFirst();
    }

    public void remove(Object entity) {
        em.remove(entity);
    }

    public void flush() {
        em.flush();
    }

    public void refresh(Object entity) {
        em.refresh(entity);
    }
}
