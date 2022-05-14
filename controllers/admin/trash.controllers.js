import {
  sequelize,
  RentingDetail,
  Renting,
  Room,
  Type,
  UserRenting,
  User,
  Setting
} from "../../models";
import { Op } from "sequelize";
import price from "../../constants/price";
import createHttpError from "http-errors";
import { payTrashSchema } from "../../validators/admins/trash.validator";

import paidType from "../../constants/paidType";

import { getTrashPrice } from "../../constants/price";
// count people in renting and calculate price
exports.payTrash = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const validationResult = await payTrashSchema.validateAsync(req.body);
    const renting_detail = await RentingDetail.findByPk(
      validationResult.renting_detail_id
    );

    if (!renting_detail) createHttpError.NotFound("Renting not found");

    if (renting_detail.is_trash_pay==paidType.PAID) {
      throw createHttpError(400, "This record already paid");
    }

    const isUserExist = await User.findByPk(validationResult.pay_by);

    if (!isUserExist) throw createHttpError(404, "User is not found");

    const amountOfPeople = await UserRenting.count({
      where: {
        renting_id: renting_detail.renting_id,
      },
    });
    

    if (amountOfPeople <= 0) {
      return res
        .status(404)
        .json({
          message: "Renting result not found or no user in renting list",
        });
    }

    const trash_price = await Setting.findOne({
      where:{
        name:"trash_price"
      }
  });
    //let allTrashPrice = getTrashPrice() * amountOfPeople;

    let allTrashPrice = parseInt(trash_price) * amountOfPeople;

    await RentingDetail.update(
      {
        is_trash_pay: paidType.PAID,
        trash_pay_amount: allTrashPrice,
        trash_pay_by:validationResult.pay_by,
      },
      {
        where: {
          id: renting_detail.id,
        },
      },
      {
        transaction: t,
      }
    );
    await t.commit();
    return res.status(200).json({
      message: "Trash pay successfully",
      success: true,
    });

    /**
         * 
         where: {
        [Op.and]: [
          { questionId: req.params.id },
          { nextQuestion: validationResult.nextQuestion_id },
        ],
      },
         */
  } catch (err) {
    await t.rollback();
    next(err);
  }
};



