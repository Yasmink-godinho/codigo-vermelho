package com.codigovermelho.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

@Configuration
public class AnaliseThreadPoolConfig {

    @Bean(destroyMethod = "shutdown")
    public ThreadPoolExecutor analiseExecutorService(
            @Value("${analise.thread-pool.size:8}") int tamanhoPool) {
        if (tamanhoPool < 1) {
            throw new IllegalArgumentException("analise.thread-pool.size deve ser maior que zero");
        }
        return new ThreadPoolExecutor(tamanhoPool, tamanhoPool, 0L, TimeUnit.MILLISECONDS,
                new LinkedBlockingQueue<>());
    }
}