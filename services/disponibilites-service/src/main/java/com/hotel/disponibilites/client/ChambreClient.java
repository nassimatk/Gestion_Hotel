package com.hotel.disponibilites.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

@Component
public class ChambreClient {

    private final RestClient restClient;
    private final boolean mock;

    public ChambreClient(@Value("${chambres.service.url}") String baseUrl,
                         @Value("${chambres.mock}") boolean mock) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.mock = mock;
    }

    public boolean existe(Long chambreId) {
        if (mock) {
            return chambreId >= 1 && chambreId <= 10;
        }
        try {
            restClient.get()
                    .uri("/chambres/{id}", chambreId)
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (HttpClientErrorException.NotFound e) {
            return false;
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Service chambres indisponible");
        }
    }
}