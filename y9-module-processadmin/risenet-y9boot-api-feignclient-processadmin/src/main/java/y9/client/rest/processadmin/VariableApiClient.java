package y9.client.rest.processadmin;

import org.springframework.cloud.openfeign.FeignClient;

import net.risesoft.api.processadmin.VariableApi;

/**
 * @author qinman
 * @author zhangchongjie
 * @date 2022/12/19
 */
@FeignClient(contextId = "VariableApiClient", name = "${y9.service.processAdmin.name:processAdmin}",
    url = "${y9.service.processAdmin.directUrl:}",
    path = "/${y9.service.processAdmin.name:server-processadmin}/services/rest/variable")
public interface VariableApiClient extends VariableApi {

}
