package br.com.pethub;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.assertj.core.api.Assertions.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import tools.jackson.databind.ObjectMapper;
import java.util.UUID;

@SpringBootTest @ActiveProfiles("test") @AutoConfigureMockMvc
class HttpSecurityTest {
    @Autowired MockMvc mvc; @Autowired ObjectMapper json;
    @Test void authenticationValidationRoleIsolationAndRevocation() throws Exception {
        mvc.perform(get("/api/v1/pets")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"A\",\"email\":\"invalid\",\"password\":\"short\",\"role\":\"TUTOR\"}")).andExpect(status().isBadRequest());
        String email=UUID.randomUUID()+"@test.invalid";
        String body="{\"name\":\"Tutor\",\"email\":\""+email+"\",\"password\":\"SafePassword123!\",\"role\":\"TUTOR\"}";
        String result=mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isCreated()).andExpect(jsonPath("$.user.passwordHash").doesNotExist()).andReturn().getResponse().getContentAsString();
        String token=json.readTree(result).path("accessToken").asString();
        mvc.perform(get("/api/v1/auth/me").header("Authorization","Bearer "+token)).andExpect(status().isOk()).andExpect(jsonPath("$.email").value(email));
        mvc.perform(get("/api/v1/merchant/orders").header("Authorization","Bearer "+token)).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/auth/logout").header("Authorization","Bearer "+token)).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/pets").header("Authorization","Bearer "+token)).andExpect(status().isUnauthorized());
    }
    @Test void noPublicAdminAndInvalidWebhookCannotChangePayments() throws Exception {
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Admin\",\"email\":\"admin@test.invalid\",\"password\":\"SafePassword123!\",\"role\":\"ADMIN\"}")).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/webhooks/mercadopago").param("data.id","123").header("x-signature","ts=1,v1=forged").header("x-request-id","123")).andExpect(status().isUnauthorized());
    }
    @Test void openApiContainsTheImplementedContract() throws Exception {
        String body=mvc.perform(get("/v3/api-docs")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(body).path("paths").has("/api/v1/orders")).isTrue();
        assertThat(json.readTree(body).path("paths").has("/api/v1/merchant/orders/{id}/triage")).isTrue();
    }
}
