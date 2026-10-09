package handlers

import (
	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
)

type CustomerHandler struct {
	Service *services.CustomerService
}

func NewCustomerHandler(service *services.CustomerService) *CustomerHandler {
	return &CustomerHandler{Service: service}
}

func (h *CustomerHandler) List(c *gin.Context) {
	page, limit := utils.GetPagination(c)
	q := c.Query("q")
	users, total, err := h.Service.AdminListCustomers(page, limit, q)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy danh sách khách hàng")
		return
	}
	utils.SuccessWithMeta(c, http.StatusOK, "Thành công", users, utils.BuildMeta(page, limit, total))
}

func (h *CustomerHandler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID không hợp lệ")
		return
	}
	user, err := h.Service.AdminGetCustomer(id)
	if err != nil {
		if err.Error() == "customer not found" {
			utils.Fail(c, http.StatusNotFound, "Không tìm thấy khách hàng")
			return
		}
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy thông tin khách hàng")
		return
	}
	utils.Success(c, http.StatusOK, "Thành công", user)
}

func (h *CustomerHandler) ToggleStatus(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID không hợp lệ")
		return
	}
	if err := h.Service.AdminToggleStatus(id); err != nil {
		if err.Error() == "customer not found" {
			utils.Fail(c, http.StatusNotFound, "Không tìm thấy khách hàng")
			return
		}
		utils.Fail(c, http.StatusInternalServerError, "Lỗi thay đổi trạng thái khách hàng")
		return
	}
	utils.Success(c, http.StatusOK, "Thay đổi trạng thái khách hàng thành công", nil)
}
