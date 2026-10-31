package br.com.pethub;

import javax.crypto.Cipher;
import javax.crypto.spec.*;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class Crypto {
    private final byte[] key;
    public Crypto(@Value("${pethub.encryption-key}") String value,@Value("${pethub.payment-mode}") String mode,Environment environment) {
        boolean prod=Arrays.asList(environment.getActiveProfiles()).contains("prod");
        if(prod&&!mode.equals("mercadopago")) throw new IllegalStateException("Produção exige Mercado Pago");
        if(value.isBlank()&&mode.equals("local")&&!prod) key=HexFormat.of().parseHex(AuthService.hash("pethub-local-simulation-only"));
        else { try { key=Base64.getDecoder().decode(value); } catch(IllegalArgumentException e) { throw new IllegalStateException("PETHUB_ENCRYPTION_KEY deve ser Base64"); } }
        if(key.length!=32) throw new IllegalStateException("Configure PETHUB_ENCRYPTION_KEY com 32 bytes aleatórios em Base64");
    }
    public String encrypt(String clear) {
        try {
            byte[] iv=new byte[12]; new SecureRandom().nextBytes(iv); Cipher c=Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.ENCRYPT_MODE,new SecretKeySpec(key,"AES"),new GCMParameterSpec(128,iv));
            byte[] encrypted=c.doFinal(clear.getBytes(StandardCharsets.UTF_8)); byte[] all=new byte[iv.length+encrypted.length];
            System.arraycopy(iv,0,all,0,iv.length); System.arraycopy(encrypted,0,all,iv.length,encrypted.length);
            return Base64.getEncoder().encodeToString(all);
        } catch(Exception e) { throw new IllegalStateException("Falha de criptografia",e); }
    }
    public String decrypt(String encoded) {
        try {
            byte[] all=Base64.getDecoder().decode(encoded); Cipher c=Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE,new SecretKeySpec(key,"AES"),new GCMParameterSpec(128,Arrays.copyOf(all,12)));
            return new String(c.doFinal(Arrays.copyOfRange(all,12,all.length)),StandardCharsets.UTF_8);
        } catch(Exception e) { throw new IllegalStateException("Não foi possível decifrar credencial",e); }
    }
}
