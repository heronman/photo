package net.agl.photo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.web.servlet.config.annotation.DefaultServletHandlerConfigurer;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * @author valinor
 * @since 2018-01-16
 */
@Configuration
@EnableWebMvc
@ComponentScan("net.agl.photo")
public class WebConfig implements WebMvcConfigurer {

    private Environment env;

    @Autowired
    public WebConfig(Environment env) {
        this.env = env;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
//        registry
//                .addResourceHandler("/download/**")
//                .addResourceLocations(env.getProperty("photo.storage.root", "~/photo/storage"));
//        registry
//                .addResourceHandler("/static/**") // static media, js, css etc.
//                .addResourceLocations("classpath:/static/");
    }

    @Override
    public void configureDefaultServletHandling(DefaultServletHandlerConfigurer configurer) {
        configurer.enable();
    }

//    @Bean
//    @Autowired
//    public ServletContextTemplateResolver templateResolver(ServletContext context) {
//        ServletContextTemplateResolver resolver = new ServletContextTemplateResolver(context);
//        resolver.setPrefix("/WEB-INF/templates/");
//        resolver.setSuffix(".html");
//        resolver.setTemplateMode("HTML5");
//        resolver.setCacheable(false);
//        return resolver;
//    }
//
//    @Bean
//    @Autowired
//    public SpringTemplateEngine templateEngine(ServletContextTemplateResolver resolver) {
//        SpringTemplateEngine engine = new SpringTemplateEngine();
//        engine.setTemplateResolver(resolver);
//        return engine;
//    }
//
//    @Bean
//    @Autowired
//    public ViewResolver viewResolver(SpringTemplateEngine engine) {
//        ThymeleafViewResolver resolver = new ThymeleafViewResolver();
//        resolver.setTemplateEngine(engine);
//        resolver.setOrder(1);
//        resolver.setViewNames(new String[]{ "*" });
//        resolver.setCharacterEncoding("UTF-8");
//        return resolver;
//    }

}
